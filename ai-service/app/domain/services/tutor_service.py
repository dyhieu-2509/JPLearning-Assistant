from abc import ABC, abstractmethod

from app.domain.schemas import TutorChatRequest, TutorChatResponse


class TutorService(ABC):
    """Contract for RAG-based Japanese tutoring."""

    @abstractmethod
    def chat(self, request: TutorChatRequest) -> TutorChatResponse:
        """Generate a grounded tutor answer for a learner question."""
