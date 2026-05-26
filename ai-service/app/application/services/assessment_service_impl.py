from app.domain.schemas import (
    AssessmentEvaluateRequest,
    AssessmentEvaluateResponse,
    AssessmentGenerateRequest,
    AssessmentGenerateResponse,
    QuizQuestion,
)
from app.domain.services.assessment_service import AssessmentService


class AssessmentServiceImpl(AssessmentService):
    """Assessment service scaffold for placement and quiz workflows."""

    def generate(self, request: AssessmentGenerateRequest) -> AssessmentGenerateResponse:
        """Generate deterministic sample questions until KG question bank is ready."""
        count = min(request.question_count, 3)
        questions = [
            QuizQuestion(
                id=f"{request.level}-{request.category}-{index}",
                prompt="「食べます」の辞書形は何ですか。",
                options=["食べる", "食べた", "食べて", "食べない"],
                answer="食べる",
                explanation="ます形「食べます」の辞書形は「食べる」です。",
            )
            for index in range(1, count + 1)
        ]
        return AssessmentGenerateResponse(questions=questions)

    def evaluate(self, request: AssessmentEvaluateRequest) -> AssessmentEvaluateResponse:
        """Evaluate submitted answers with the scaffold answer key."""
        total = len(request.answers)
        score = sum(1 for answer in request.answers.values() if answer == "食べる")
        weak_areas = [] if score == total else ["verb dictionary form"]
        return AssessmentEvaluateResponse(score=score, total=total, weakAreas=weak_areas)
