from fastapi import APIRouter, Depends

from app.dependencies import get_planner_service
from app.domain.schemas import PlannerRequest, PlannerResponse
from app.domain.services.planner_service import PlannerService

router = APIRouter(prefix="/api/v1/planner", tags=["Planner"])


@router.post("/recommend", response_model=PlannerResponse)
def recommend(
    request: PlannerRequest,
    planner_service: PlannerService = Depends(get_planner_service),
) -> PlannerResponse:
    """Generate a recommended study roadmap."""
    return planner_service.recommend(request)
