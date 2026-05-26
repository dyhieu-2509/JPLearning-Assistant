from abc import ABC, abstractmethod

from app.domain.schemas import (
    AssessmentEvaluateRequest,
    AssessmentEvaluateResponse,
    AssessmentGenerateRequest,
    AssessmentGenerateResponse,
)


class AssessmentService(ABC):
    """Contract for quiz generation and evaluation."""

    @abstractmethod
    def generate(self, request: AssessmentGenerateRequest) -> AssessmentGenerateResponse:
        """Generate assessment questions."""

    @abstractmethod
    def evaluate(self, request: AssessmentEvaluateRequest) -> AssessmentEvaluateResponse:
        """Evaluate submitted answers."""
