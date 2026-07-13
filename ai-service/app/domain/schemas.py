from pydantic import BaseModel, ConfigDict, Field, field_validator


SUPPORTED_MVP_LEVELS = {"N5", "N4"}
SUPPORTED_LEARNING_PATHWAYS = {"jlpt_foundation", "conversation", "school", "work", "reading"}


def normalize_mvp_level(value: str | None, default: str) -> str:
    """Normalize JLPT level to the N5/N4 MVP scope."""
    if value is None or str(value).strip() == "":
        return default
    normalized = str(value).strip().upper()
    if normalized not in SUPPORTED_MVP_LEVELS:
        raise ValueError("level must be N5 or N4 for the MVP scope")
    return normalized


def normalize_learning_pathway(value: str | None) -> str:
    """Normalize the learner pathway used for personalization."""
    if value is None or str(value).strip() == "":
        return "jlpt_foundation"
    normalized = str(value).strip().lower().replace("-", "_")
    if normalized not in SUPPORTED_LEARNING_PATHWAYS:
        raise ValueError("learningPathway is not supported")
    return normalized


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


class StudentProfileContext(BaseModel):
    """Learner profile snapshot supplied by the backend."""

    user_id: str = Field(alias="userId")
    current_level: str = Field(default="N5", alias="currentLevel")
    target_level: str = Field(default="N4", alias="targetLevel")
    goal: str = "JLPT preparation"
    learning_pathway: str = Field(default="jlpt_foundation", alias="learningPathway")
    daily_study_minutes: int = Field(default=30, alias="dailyStudyMinutes")
    explanation_style: str = Field(default="concise", alias="explanationStyle")
    romaji_enabled: bool = Field(default=True, alias="romajiEnabled")
    weak_skills: list[str] = Field(default_factory=list, alias="weakSkills")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("current_level", mode="before")
    @classmethod
    def validate_current_level(cls, value: str | None) -> str:
        """Keep learner current level inside the MVP scope."""
        return normalize_mvp_level(value, "N5")

    @field_validator("target_level", mode="before")
    @classmethod
    def validate_target_level(cls, value: str | None) -> str:
        """Keep learner target level inside the MVP scope."""
        return normalize_mvp_level(value, "N4")

    @field_validator("learning_pathway", mode="before")
    @classmethod
    def validate_learning_pathway(cls, value: str | None) -> str:
        """Normalize the learner pathway used for personalization."""
        return normalize_learning_pathway(value)


class KnowledgeProgressContext(BaseModel):
    """Learner mastery snapshot for one knowledge item."""

    knowledge_type: str = Field(alias="knowledgeType")
    knowledge_id: str = Field(alias="knowledgeId")
    title: str = ""
    level: str = "N5"
    mastery_score: float = Field(default=0.0, alias="masteryScore")
    correct_count: int = Field(default=0, alias="correctCount")
    wrong_count: int = Field(default=0, alias="wrongCount")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("level", mode="before")
    @classmethod
    def validate_level(cls, value: str | None) -> str:
        """Keep progress level inside the MVP scope."""
        return normalize_mvp_level(value, "N5")


class TutorChatRequest(BaseModel):
    """Learner question sent by the backend."""

    message: str = Field(min_length=1, max_length=2000)
    user_id: str | None = Field(default=None, alias="userId")
    context_topic: str | None = Field(default=None, alias="contextTopic")
    profile: StudentProfileContext | None = None
    weak_progress: list[KnowledgeProgressContext] = Field(default_factory=list, alias="weakProgress")

    model_config = ConfigDict(populate_by_name=True)


class TutorChatResponse(BaseModel):
    """Tutor answer returned to the backend."""

    answer: str
    sources: list[KnowledgeSource] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class PlannerRequest(BaseModel):
    """Input data for generating a learning roadmap."""

    current_level: str = Field(default="N5", alias="currentLevel")
    target_level: str = Field(default="N4", alias="targetLevel")
    weekly_study_hours: int = Field(default=5, ge=1, le=40, alias="weeklyStudyHours")
    goal: str = "JLPT preparation"
    learning_pathway: str = Field(default="jlpt_foundation", alias="learningPathway")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("current_level", mode="before")
    @classmethod
    def validate_current_level(cls, value: str | None) -> str:
        """Keep planner current level inside the MVP scope."""
        return normalize_mvp_level(value, "N5")

    @field_validator("target_level", mode="before")
    @classmethod
    def validate_target_level(cls, value: str | None) -> str:
        """Keep planner target level inside the MVP scope."""
        return normalize_mvp_level(value, "N4")

    @field_validator("learning_pathway", mode="before")
    @classmethod
    def validate_learning_pathway(cls, value: str | None) -> str:
        """Normalize the planner pathway used for task selection."""
        return normalize_learning_pathway(value)


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

    @field_validator("level", mode="before")
    @classmethod
    def validate_level(cls, value: str | None) -> str:
        """Keep assessment level inside the MVP scope."""
        return normalize_mvp_level(value, "N5")


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
