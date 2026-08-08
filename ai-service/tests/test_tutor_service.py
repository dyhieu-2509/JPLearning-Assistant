import pytest
from pydantic import ValidationError

from app.application.services.assessment_service_impl import AssessmentServiceImpl
from app.application.services.planner_service_impl import PlannerServiceImpl
from app.application.services.tutor_service_impl import TutorServiceImpl
from app.domain.schemas import (
    AssessmentGenerateRequest,
    KnowledgeSource,
    PlannerRequest,
    StudentProfileContext,
    TutorChatRequest,
)
from app.infrastructure.llm.langchain_client import LangChainClient


class FakeNeo4jReader:
    def __init__(self) -> None:
        self.last_level = ""

    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
        self.last_level = level
        return [
            KnowledgeSource(
                type="GrammarPoint",
                id="te-form:N5",
                title="te form",
                meaningVi="d\u1ea1ng n\u1ed1i c\u1ee7a \u0111\u1ed9ng t\u1eeb",
                level=level,
                source="test",
            )
        ]


class FakeQdrantClient:
    def __init__(self) -> None:
        self.last_level = ""

    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
        self.last_level = level
        return [
            KnowledgeSource(
                type="Vocabulary",
                id="\u305f\u3079\u307e\u3059:N5",
                title="\u98df\u3079\u307e\u3059",
                reading="\u305f\u3079\u307e\u3059",
                meaningEn="eat",
                level=level,
                source="test-vector",
            )
        ]


class EmptyRetriever:
    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
        return []


class DuplicateNeo4jReader:
    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
        return [
            KnowledgeSource(
                type="GrammarPoint",
                id="duplicate-kg:N5",
                title="te form",
                reading="",
                meaningVi="d\u1ea1ng n\u1ed1i c\u1ee7a \u0111\u1ed9ng t\u1eeb",
                level=level,
                source="kg",
            ),
            KnowledgeSource(
                type="GrammarPoint",
                id="graph-only:N5",
                title="\u306f",
                meaningVi="tr\u1ee3 t\u1eeb n\u00eau ch\u1ee7 \u0111\u1ec1",
                level=level,
                source="kg",
            ),
        ]


class DuplicateQdrantClient:
    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
        return [
            KnowledgeSource(
                type="GrammarPoint",
                id="duplicate-vector:N5",
                title="te form",
                reading="",
                meaningVi="d\u1ea1ng n\u1ed1i c\u1ee7a \u0111\u1ed9ng t\u1eeb",
                level=level,
                source="vector",
            )
        ]


class FakeSettings:
    embedding_vector_size = 384
    llm_provider = "mock"


def test_tutor_service_returns_grounded_personalized_answer() -> None:
    neo4j_reader = FakeNeo4jReader()
    qdrant_client = FakeQdrantClient()
    service = TutorServiceImpl(neo4j_reader, qdrant_client, LangChainClient(FakeSettings()))

    response = service.chat(
        TutorChatRequest(
            message="\u3066 form l\u00e0 g\u00ec?",
            profile=StudentProfileContext(
                userId="user-1",
                currentLevel="N4",
                targetLevel="N4",
                goal="JLPT N4",
                explanationStyle="detailed",
                weakSkills=["grammar"],
            ),
        )
    )

    assert neo4j_reader.last_level == "N4"
    assert qdrant_client.last_level == "N4"
    assert response.confidence == 0.78
    assert response.sources[0].title == "te form"
    assert response.sources[1].title == "\u98df\u3079\u307e\u3059"
    assert "Ho so hoc" in response.answer


def test_profile_context_rejects_levels_outside_mvp_scope() -> None:
    with pytest.raises(ValidationError):
        StudentProfileContext(userId="user-1", currentLevel="N3", targetLevel="N3")


def test_tutor_merges_kg_and_vector_sources_without_duplicates() -> None:
    service = TutorServiceImpl(DuplicateNeo4jReader(), DuplicateQdrantClient(), LangChainClient(FakeSettings()))

    response = service.chat(TutorChatRequest(message="\u3066 form la gi?"))

    assert response.confidence == 0.78
    assert [source.id for source in response.sources] == ["duplicate-kg:N5", "graph-only:N5"]
    assert len({(source.type, source.title, source.reading) for source in response.sources}) == len(response.sources)


def test_tutor_confidence_drops_when_retrieval_has_less_evidence() -> None:
    vector_only = TutorServiceImpl(EmptyRetriever(), FakeQdrantClient(), LangChainClient(FakeSettings()))
    no_sources = TutorServiceImpl(EmptyRetriever(), EmptyRetriever(), LangChainClient(FakeSettings()))

    vector_response = vector_only.chat(TutorChatRequest(message="tabemasu la gi?"))
    empty_response = no_sources.chat(TutorChatRequest(message="cau khong co nguon"))

    assert vector_response.confidence == 0.62
    assert len(vector_response.sources) == 1
    assert empty_response.confidence == 0.3
    assert empty_response.sources == []
    assert "Minh chua co nguon" in empty_response.answer


def test_planner_prioritizes_the_learner_pathway() -> None:
    response = PlannerServiceImpl().recommend(
        PlannerRequest(
            currentLevel="N5",
            targetLevel="N4",
            weeklyStudyHours=5,
            goal="daily conversation",
            learningPathway="conversation",
        )
    )

    assert response.items[0].title == "Luyện một đoạn hội thoại ngắn"


def test_assessment_uses_different_grammar_questions_for_n5_and_n4() -> None:
    service = AssessmentServiceImpl()

    n5 = service.generate(AssessmentGenerateRequest(level="N5", category="grammar", questionCount=3))
    n4 = service.generate(AssessmentGenerateRequest(level="N4", category="grammar", questionCount=3))

    assert n5.questions[0].id == "N5-grammar-1"
    assert n4.questions[0].id == "N4-grammar-1"
    assert n5.questions[0].prompt != n4.questions[0].prompt
    assert "\u3067\u3059" in n5.questions[0].prompt
    assert "\u306a\u3051\u308c\u3070\u306a\u308a\u307e\u305b\u3093" in n4.questions[0].prompt


def test_assessment_uses_category_specific_questions() -> None:
    service = AssessmentServiceImpl()

    grammar = service.generate(AssessmentGenerateRequest(level="N5", category="grammar", questionCount=1))
    vocabulary = service.generate(AssessmentGenerateRequest(level="N5", category="vocabulary", questionCount=1))
    kanji = service.generate(AssessmentGenerateRequest(level="N5", category="kanji", questionCount=1))

    prompts = {grammar.questions[0].prompt, vocabulary.questions[0].prompt, kanji.questions[0].prompt}
    assert len(prompts) == 3
    assert grammar.questions[0].id == "N5-grammar-1"
    assert vocabulary.questions[0].id == "N5-vocabulary-1"
    assert kanji.questions[0].id == "N5-kanji-1"
