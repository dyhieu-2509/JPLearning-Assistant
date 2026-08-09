from abc import ABC, abstractmethod

from app.domain.schemas import PronunciationScoreResponse


class PronunciationService(ABC):
    """Scores a short learner pronunciation recording."""

    @abstractmethod
    def score(
        self,
        target_text: str,
        audio_bytes: bytes,
        mime_type: str,
        lesson_title: str = "",
        level: str = "N5",
    ) -> PronunciationScoreResponse:
        """Return transcript, score and tutor feedback for learner audio."""
