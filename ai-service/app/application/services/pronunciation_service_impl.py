from __future__ import annotations

import json
import re
from typing import Any, Callable

from app.config.settings import Settings
from app.domain.schemas import PronunciationScoreResponse
from app.domain.services.pronunciation_service import PronunciationService

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover - keeps tests runnable before optional deps are installed.
    genai = None
    types = None


class PronunciationServiceImpl(PronunciationService):
    """Gemini-based MVP pronunciation scorer."""

    def __init__(
        self,
        settings: Settings,
        client_factory: Callable[[str], Any] | None = None,
    ) -> None:
        self._settings = settings
        self._client_factory = client_factory
        self._client = None

    def score(
        self,
        target_text: str,
        audio_bytes: bytes,
        mime_type: str,
        lesson_title: str = "",
        level: str = "N5",
    ) -> PronunciationScoreResponse:
        """Return a transcript, rough score and concise Vietnamese tutor feedback."""
        target = target_text.strip()
        if not target:
            return self._fallback("Chua co cau mau de so sanh phat am.", target)
        if not audio_bytes:
            return self._fallback("Chua nhan duoc file ghi am.", target)
        if not self._is_gemini_audio_enabled():
            return self._fallback(
                "Chua bat duoc Gemini audio trong AI service. Kiem tra GEMINI_API_KEY va google-genai.",
                target,
            )

        try:
            payload = self._call_gemini(target, audio_bytes, mime_type, lesson_title, level)
            return self._response_from_payload(payload, target)
        except Exception:
            return self._fallback(
                "Gemini chua cham duoc file nay. Hay thu ghi am ngan hon va ro hon.",
                target,
            )

    def _is_gemini_audio_enabled(self) -> bool:
        return bool(getattr(self._settings, "gemini_api_key", None)) and (
            self._client_factory is not None or (genai is not None and types is not None)
        )

    def _call_gemini(
        self,
        target: str,
        audio_bytes: bytes,
        mime_type: str,
        lesson_title: str,
        level: str,
    ) -> dict[str, Any]:
        client = self._get_client()
        audio_part = (
            types.Part.from_bytes(
                data=audio_bytes,
                mime_type=mime_type or "audio/webm",
            )
            if types is not None
            else {"inline_data": {"mime_type": mime_type or "audio/webm", "data": audio_bytes}}
        )
        config = (
            types.GenerateContentConfig(response_mime_type="application/json")
            if types is not None
            else {"response_mime_type": "application/json"}
        )
        response = client.models.generate_content(
            model=str(getattr(self._settings, "gemini_model", "gemini-2.5-flash")),
            contents=[
                self._build_prompt(target, lesson_title, level),
                audio_part,
            ],
            config=config,
        )
        return self._parse_json_response(getattr(response, "text", str(response)))

    def _get_client(self):
        if self._client is None:
            api_key = str(getattr(self._settings, "gemini_api_key", ""))
            if self._client_factory is not None:
                self._client = self._client_factory(api_key)
            else:
                self._client = genai.Client(api_key=api_key)
        return self._client

    def _build_prompt(self, target: str, lesson_title: str, level: str) -> str:
        return (
            "You are VAJA pronunciation tutor for Vietnamese learners of Japanese.\n"
            "Listen to the audio, transcribe the Japanese phrase you hear, compare it with the target, "
            "and return strict JSON only.\n"
            f"Target Japanese: {target}\n"
            f"Lesson: {lesson_title or 'study lesson'}\n"
            f"Level: {level or 'N5'}\n"
            "JSON schema:\n"
            "{"
            "\"transcript\":\"heard Japanese text\","
            "\"scorePercent\":0,"
            "\"verdict\":\"GOOD|HARD|AGAIN\","
            "\"issues\":[\"short Vietnamese issue\"],"
            "\"feedback\":\"Vietnamese feedback, max 3 short sentences\","
            "\"confidence\":0.0"
            "}\n"
            "Scoring guide: GOOD >= 80, HARD 60-79, AGAIN < 60. "
            "If audio is unclear, transcript is empty, score below 50 and verdict AGAIN. "
            "Use simple Vietnamese, not academic wording."
        )

    def _parse_json_response(self, value: str) -> dict[str, Any]:
        text = value.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
            text = re.sub(r"```$", "", text).strip()
        if not text.startswith("{"):
            match = re.search(r"\{.*\}", text, flags=re.DOTALL)
            if match:
                text = match.group(0)
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}

    def _response_from_payload(self, payload: dict[str, Any], target: str) -> PronunciationScoreResponse:
        score = self._normalize_score(payload.get("scorePercent", payload.get("score_percent", 0)))
        verdict = self._normalize_verdict(str(payload.get("verdict", "")), score)
        issues = payload.get("issues", [])
        if not isinstance(issues, list):
            issues = [str(issues)]
        feedback = str(payload.get("feedback") or "").strip()
        if not feedback:
            feedback = self._default_feedback(verdict, target)
        return PronunciationScoreResponse(
            transcript=str(payload.get("transcript") or "").strip(),
            scorePercent=score,
            verdict=verdict,
            feedback=feedback,
            issues=[str(issue).strip() for issue in issues if str(issue).strip()][:4],
            confidence=self._normalize_confidence(payload.get("confidence", 0.65)),
        )

    def _normalize_score(self, value: Any) -> int:
        try:
            score = int(round(float(value)))
        except (TypeError, ValueError):
            score = 0
        return max(0, min(100, score))

    def _normalize_confidence(self, value: Any) -> float:
        try:
            confidence = float(value)
        except (TypeError, ValueError):
            confidence = 0.0
        return max(0.0, min(1.0, confidence))

    def _normalize_verdict(self, value: str, score: int) -> str:
        normalized = value.strip().upper()
        if normalized in {"GOOD", "HARD", "AGAIN"}:
            return normalized
        if score >= 80:
            return "GOOD"
        if score >= 60:
            return "HARD"
        return "AGAIN"

    def _fallback(self, message: str, target: str) -> PronunciationScoreResponse:
        return PronunciationScoreResponse(
            transcript="",
            scorePercent=45,
            verdict="AGAIN",
            feedback=f"{message} Hay nghe mau roi doc lai cau: {target}",
            issues=["Chua co transcript du tin cay"],
            confidence=0.2,
        )

    def _default_feedback(self, verdict: str, target: str) -> str:
        if verdict == "GOOD":
            return "Ban doc kha on. Giu nhip nay va doc lai mot lan nua cho tu nhien hon."
        if verdict == "HARD":
            return f"Gan dung roi. Nghe mau va doc cham lai cau: {target}"
        return f"Can luyen lai cau nay. Nghe mau, chia nho tung cum, roi doc lai: {target}"
