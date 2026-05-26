from fastapi import APIRouter, Depends

from app.dependencies import get_tutor_service
from app.domain.schemas import TutorChatRequest, TutorChatResponse
from app.domain.services.tutor_service import TutorService

router = APIRouter(prefix="/api/v1/tutor", tags=["Tutor"])


@router.post("/chat", response_model=TutorChatResponse)
def chat(
    request: TutorChatRequest,
    tutor_service: TutorService = Depends(get_tutor_service),
) -> TutorChatResponse:
    """Answer a learner question with RAG grounding."""
    return tutor_service.chat(request)
