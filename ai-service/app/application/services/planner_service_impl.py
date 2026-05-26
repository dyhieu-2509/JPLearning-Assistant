from app.domain.schemas import PlannerRequest, PlannerResponse, StudyPlanItem
from app.domain.services.planner_service import PlannerService


class PlannerServiceImpl(PlannerService):
    """Simple prerequisite-aware roadmap placeholder for Phase 3."""

    def recommend(self, request: PlannerRequest) -> PlannerResponse:
        """Generate a compact learning plan for the current prototype."""
        hours = max(1, min(request.weekly_study_hours, 40))
        items = [
            StudyPlanItem(
                order=1,
                title="Ôn bảng chữ và từ vựng nền tảng",
                objective=f"Củng cố từ vựng {request.current_level} theo nhóm bài học.",
                estimatedHours=round(hours * 0.35, 1),
            ),
            StudyPlanItem(
                order=2,
                title="Học ngữ pháp trọng tâm",
                objective="Ưu tiên mẫu câu có quan hệ prerequisite trong Knowledge Graph.",
                estimatedHours=round(hours * 0.4, 1),
            ),
            StudyPlanItem(
                order=3,
                title="Quiz và sửa lỗi",
                objective="Làm bài đánh giá ngắn để cập nhật weak areas và progress.",
                estimatedHours=round(hours * 0.25, 1),
            ),
        ]
        return PlannerResponse(level=request.current_level, goal=request.goal, items=items)
