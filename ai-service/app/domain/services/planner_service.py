from abc import ABC, abstractmethod

from app.domain.schemas import PlannerRequest, PlannerResponse


class PlannerService(ABC):
    """Contract for learning roadmap generation."""

    @abstractmethod
    def recommend(self, request: PlannerRequest) -> PlannerResponse:
        """Generate a study plan from learner goals and available time."""
