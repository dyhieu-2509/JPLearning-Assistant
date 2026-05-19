from __future__ import annotations

from app.config.settings import Settings
from app.domain.schemas import KnowledgeProgressContext, KnowledgeSource, StudentProfileContext

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:  # pragma: no cover - keeps tests runnable before optional deps are installed.
    ChatGoogleGenerativeAI = None


class LangChainClient:
    """LLM adapter used by the Tutor Agent."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._gemini_model = None

    def generate_tutor_answer(
        self,
        message: str,
        sources: list[KnowledgeSource],
        profile: StudentProfileContext | None = None,
        weak_progress: list[KnowledgeProgressContext] | None = None,
    ) -> str:
        """Generate a Vietnamese tutor answer from retrieved context."""
        if self._is_gemini_enabled():
            try:
                return self._generate_with_gemini(message, sources, profile, weak_progress or [])
            except Exception:
                return self._generate_mock_answer(message, sources, profile, weak_progress or [])
        return self._generate_mock_answer(message, sources, profile, weak_progress or [])

    def _is_gemini_enabled(self) -> bool:
        return (
            str(getattr(self._settings, "llm_provider", "mock")).strip().lower() == "gemini"
            and bool(getattr(self._settings, "gemini_api_key", None))
            and ChatGoogleGenerativeAI is not None
        )

    def _generate_with_gemini(
        self,
        message: str,
        sources: list[KnowledgeSource],
        profile: StudentProfileContext | None,
        weak_progress: list[KnowledgeProgressContext],
    ) -> str:
        model = self._get_gemini_model()
        response = model.invoke(self._build_prompt(message, sources, profile, weak_progress))
        content = getattr(response, "content", response)
        if isinstance(content, list):
            return "\n".join(str(item) for item in content).strip()
        return str(content).strip()

    def _get_gemini_model(self):
        if self._gemini_model is None:
            self._gemini_model = ChatGoogleGenerativeAI(
                model=str(getattr(self._settings, "gemini_model", "gemini-2.5-flash")),
                google_api_key=getattr(self._settings, "gemini_api_key"),
                temperature=0.2,
            )
        return self._gemini_model

    def _build_prompt(
        self,
        message: str,
        sources: list[KnowledgeSource],
        profile: StudentProfileContext | None,
        weak_progress: list[KnowledgeProgressContext],
    ) -> str:
        context = "\n".join(self._format_source(index, source) for index, source in enumerate(sources[:8], start=1))
        if not context:
            context = "Khong co nguon kien thuc phu hop."
        learner_context = self._format_profile(profile, weak_progress)

        return (
            "Ban la tro ly hoc tieng Nhat cho nguoi Viet. "
            "Tra loi bang tieng Viet, dung muc do phu hop voi learner profile. "
            "Chi dua tren nguon duoc cung cap; neu nguon khong du thi noi ro.\n\n"
            f"Learner profile:\n{learner_context}\n\n"
            f"Cau hoi: {message}\n\n"
            f"Nguon kien thuc:\n{context}\n\n"
            "Yeu cau cau tra loi:\n"
            "- Giai thich truc tiep y nghia/cach dung.\n"
            "- Dieu chinh do kho theo currentLevel va goal cua nguoi hoc.\n"
            "- Neu lien quan den weakSkills hoac weakProgress, uu tien nhac lai ngan gon diem yeu do.\n"
            "- Neu co tu vung tieng Nhat, ghi kanji/kana va nghia.\n"
            "- Neu la ngu phap, dua 1 vi du ngan.\n"
            "- Khong bia them nguon ngoai context."
        )

    def _format_profile(
        self,
        profile: StudentProfileContext | None,
        weak_progress: list[KnowledgeProgressContext],
    ) -> str:
        if profile is None:
            return "anonymous learner; currentLevel=N5; style=concise"

        weak_items = ", ".join(
            f"{item.title or item.knowledge_id}({item.knowledge_type}, mastery={item.mastery_score:.2f})"
            for item in weak_progress[:5]
        )
        if not weak_items:
            weak_items = "none"

        weak_skills = ", ".join(profile.weak_skills) if profile.weak_skills else "none"
        return (
            f"userId={profile.user_id}; "
            f"currentLevel={profile.current_level}; "
            f"targetLevel={profile.target_level}; "
            f"goal={profile.goal}; "
            f"dailyStudyMinutes={profile.daily_study_minutes}; "
            f"explanationStyle={profile.explanation_style}; "
            f"romajiEnabled={profile.romaji_enabled}; "
            f"weakSkills={weak_skills}; "
            f"weakProgress={weak_items}"
        )

    def _format_source(self, index: int, source: KnowledgeSource) -> str:
        parts = [
            f"[{index}] type={source.type}",
            f"title={source.title}",
            f"reading={source.reading}",
            f"meaningVi={source.meaningVi}",
            f"meaningEn={source.meaningEn}",
            f"level={source.level}",
            f"source={source.source}",
        ]
        return "; ".join(part for part in parts if not part.endswith("="))

    def _generate_mock_answer(
        self,
        message: str,
        sources: list[KnowledgeSource],
        profile: StudentProfileContext | None = None,
        weak_progress: list[KnowledgeProgressContext] | None = None,
    ) -> str:
        if not sources:
            return (
                "Minh chua tim thay ngu canh phu hop trong Knowledge Graph. "
                "He thong da nhan cau hoi va san sang noi RAG; "
                "hay import du lieu Neo4j/Qdrant de cau tra loi co nguon tham chieu."
            )

        lines = [
            "Dua tren du lieu da truy xuat tu Knowledge Graph, day la phan giai thich ngan:",
        ]
        if profile is not None:
            lines.append(
                f"Ho so hoc: {profile.current_level} -> {profile.target_level}, "
                f"muc tieu: {profile.goal}, cach giai thich: {profile.explanation_style}."
            )
            if profile.weak_skills:
                lines.append(f"Diem can uu tien on: {', '.join(profile.weak_skills)}.")
        if weak_progress:
            titles = ", ".join(item.title or item.knowledge_id for item in weak_progress[:3])
            lines.append(f"Cac muc dang yeu lien quan den lo trinh: {titles}.")
        for source in sources[:3]:
            meaning = source.meaningVi or source.meaningEn or "chua co nghia chi tiet"
            reading = f" ({source.reading})" if source.reading else ""
            lines.append(f"- {source.title}{reading}: {meaning}.")

        lines.append(f"Cau hoi cua ban: {message}")
        lines.append("Ban sinh tu nhien bang Gemini se duoc dung khi cau hinh API key hop le.")
        return "\n".join(lines)
