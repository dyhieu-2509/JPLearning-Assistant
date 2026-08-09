from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_pronunciation_service
from app.domain.schemas import PronunciationScoreResponse
from app.domain.services.pronunciation_service import PronunciationService

router = APIRouter(prefix="/api/v1/pronunciation", tags=["Pronunciation"])

MAX_AUDIO_BYTES = 20 * 1024 * 1024


@router.post("/score", response_model=PronunciationScoreResponse)
async def score_pronunciation(
    audio: UploadFile = File(...),
    target_text: str = Form(..., alias="targetText"),
    lesson_title: str = Form("", alias="lessonTitle"),
    level: str = Form("N5"),
    pronunciation_service: PronunciationService = Depends(get_pronunciation_service),
) -> PronunciationScoreResponse:
    """Score a short pronunciation recording against a target Japanese sentence."""
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="audio file is empty")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="audio file is too large")
    return pronunciation_service.score(
        target_text=target_text,
        audio_bytes=audio_bytes,
        mime_type=audio.content_type or "audio/webm",
        lesson_title=lesson_title,
        level=level,
    )
