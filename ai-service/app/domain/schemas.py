from pydantic import BaseModel, ConfigDict, Field


class KnowledgeSource(BaseModel):
    """Retrieved source item used to ground an AI answer."""

    type: str
    id: str
    title: str
    reading: str = ""
    meaningVi: str = ""
    meaningEn: str = ""
    level: str = ""
    source: str = ""


class TutorChatRequest(BaseModel):
    """Learner question sent by the backend."""

    message: str = Field(min_length=1, max_length=2000)
    user_id: str | None = Field(default=None, alias="userId")
    context_topic: str | None = Field(default=None, alias="contextTopic")

    model_config = ConfigDict(populate_by_name=True)


class TutorChatResponse(BaseModel):
    """Tutor answer returned to the backend."""

    answer: str
    sources: list[KnowledgeSource] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class PlannerRequest(BaseModel):
    """Input data for generating a learning roadmap."""

    current_level: str = Field(default="N5", alias="currentLevel")
    target_level: str = Field(default="N5", alias="targetLevel")
    weekly_study_hours: int = Field(default=5, ge=1, le=40, alias="weeklyStudyHours")
    goal: str = "JLPT preparation"

    model_config = ConfigDict(populate_by_name=True)


class StudyPlanItem(BaseModel):
    """One recommended learning task."""

    order: int
    title: str
    objective: str
    estimatedHours: float


class PlannerResponse(BaseModel):
    """Generated study roadmap response."""

    level: str
    goal: str
    items: list[StudyPlanItem]


class AssessmentGenerateRequest(BaseModel):
    """Input data for quiz or placement generation."""

    level: str = "N5"
    category: str = "grammar"
    question_count: int = Field(default=10, ge=1, le=20, alias="questionCount")

    model_config = ConfigDict(populate_by_name=True)


class QuizQuestion(BaseModel):
    """Multiple-choice quiz question."""

    id: str
    prompt: str
    options: list[str]
    answer: str
    explanation: str


class AssessmentGenerateResponse(BaseModel):
    """Generated quiz question list."""

    questions: list[QuizQuestion]


class AssessmentEvaluateRequest(BaseModel):
    """Submitted answers for quiz evaluation."""

    answers: dict[str, str]


class AssessmentEvaluateResponse(BaseModel):
    """Quiz evaluation result."""

    score: int
    total: int
    weakAreas: list[str]
