from fastapi import APIRouter, Depends

from app.dependencies import get_assessment_service
from app.domain.schemas import (
    AssessmentEvaluateRequest,
    AssessmentEvaluateResponse,
    AssessmentGenerateRequest,
    AssessmentGenerateResponse,
)
from app.domain.services.assessment_service import AssessmentService

router = APIRouter(prefix="/api/v1/assessment", tags=["Assessment"])


@router.post("/generate", response_model=AssessmentGenerateResponse)
def generate(
    request: AssessmentGenerateRequest,
    assessment_service: AssessmentService = Depends(get_assessment_service),
) -> AssessmentGenerateResponse:
    """Generate quiz or placement-test questions."""
    return assessment_service.generate(request)


@router.post("/evaluate", response_model=AssessmentEvaluateResponse)
def evaluate(
    request: AssessmentEvaluateRequest,
    assessment_service: AssessmentService = Depends(get_assessment_service),
) -> AssessmentEvaluateResponse:
    """Evaluate submitted quiz answers."""
    return assessment_service.evaluate(request)
