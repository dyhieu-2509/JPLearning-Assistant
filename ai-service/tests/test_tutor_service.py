from app.application.services.tutor_service_impl import TutorServiceImpl
from app.domain.schemas import KnowledgeSource, TutorChatRequest
from app.infrastructure.llm.langchain_client import LangChainClient


class FakeNeo4jReader:
    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
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
    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
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


class FakeSettings:
    embedding_vector_size = 384
    llm_provider = "mock"


def test_tutor_service_returns_grounded_answer() -> None:
    service = TutorServiceImpl(FakeNeo4jReader(), FakeQdrantClient(), LangChainClient(FakeSettings()))

    response = service.chat(TutorChatRequest(message="\u3066 form l\u00e0 g\u00ec?"))

    assert response.confidence == 0.7
    assert response.sources[0].title == "\u98df\u3079\u307e\u3059"
    assert response.sources[1].title == "te form"
    assert "Knowledge Graph" in response.answer
