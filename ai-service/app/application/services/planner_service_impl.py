from app.domain.schemas import PlannerRequest, PlannerResponse, StudyPlanItem
from app.domain.services.planner_service import PlannerService


class PlannerServiceImpl(PlannerService):
    """Simple prerequisite-aware roadmap placeholder for Phase 3."""

    def recommend(self, request: PlannerRequest) -> PlannerResponse:
        """Generate a compact learning plan for the current prototype."""
        hours = max(1, min(request.weekly_study_hours, 40))
        pathway_item = self._pathway_item(request.learning_pathway, request.current_level, request.target_level, hours)
        items = [
            pathway_item,
            StudyPlanItem(
                order=2,
                title="Ôn bảng chữ và từ vựng nền tảng",
                objective=f"Củng cố từ vựng {request.current_level} theo nhóm bài học.",
                estimatedHours=round(hours * 0.35, 1),
            ),
            StudyPlanItem(
                order=3,
                title="Học ngữ pháp trọng tâm",
                objective="Ưu tiên mẫu câu có quan hệ prerequisite trong Knowledge Graph.",
                estimatedHours=round(hours * 0.4, 1),
            ),
            StudyPlanItem(
                order=4,
                title="Quiz và sửa lỗi",
                objective="Làm bài đánh giá ngắn để cập nhật weak areas và progress.",
                estimatedHours=round(hours * 0.25, 1),
            ),
        ]
        return PlannerResponse(level=request.current_level, goal=request.goal, items=items)

    def _pathway_item(
        self,
        learning_pathway: str,
        current_level: str,
        target_level: str,
        hours: int,
    ) -> StudyPlanItem:
        """Create the first task based on the learner pathway."""
        estimated_hours = round(max(0.5, hours * 0.2), 1)
        match learning_pathway:
            case "conversation":
                return StudyPlanItem(
                    order=1,
                    title="Luyện một đoạn hội thoại ngắn",
                    objective=f"Tạo hội thoại {current_level}/{target_level}, rồi hỏi VAJA sửa trợ từ và cách nói tự nhiên.",
                    estimatedHours=estimated_hours,
                )
            case "school":
                return StudyPlanItem(
                    order=1,
                    title="Ôn bài trên lớp kế tiếp",
                    objective="Chọn từ vựng, mẫu câu và một bài tập ngắn theo nội dung đang học ở trường.",
                    estimatedHours=estimated_hours,
                )
            case "work":
                return StudyPlanItem(
                    order=1,
                    title="Luyện một tình huống công việc",
                    objective="Ôn cách nói lịch sự trong tự giới thiệu, nhờ hỗ trợ hoặc viết email ngắn.",
                    estimatedHours=estimated_hours,
                )
            case "reading":
                return StudyPlanItem(
                    order=1,
                    title="Đọc một đoạn ngắn N5/N4",
                    objective="Đánh dấu từ mới, tra nghĩa, rồi đưa từ khó vào thẻ nhớ.",
                    estimatedHours=estimated_hours,
                )
            case _:
                return StudyPlanItem(
                    order=1,
                    title="Đi một bước trên pathway JLPT",
                    objective="Học một mục mới, làm quiz ngắn, sửa lỗi và ôn lại thẻ đến hạn.",
                    estimatedHours=estimated_hours,
                )
