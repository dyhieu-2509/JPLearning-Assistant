from app.domain.schemas import TutorChatRequest, TutorChatResponse
from app.domain.services.tutor_service import TutorService
from app.infrastructure.graphdb.neo4j_reader import Neo4jReader
from app.infrastructure.llm.langchain_client import LangChainClient
from app.infrastructure.vectordb.qdrant_client import QdrantVectorClient


class TutorServiceImpl(TutorService):
    """RAG-based tutor service implementation."""

    def __init__(
        self,
        neo4j_reader: Neo4jReader,
        qdrant_client: QdrantVectorClient,
        llm_client: LangChainClient,
    ) -> None:
        self._neo4j_reader = neo4j_reader
        self._qdrant_client = qdrant_client
        self._llm_client = llm_client

    def chat(self, request: TutorChatRequest) -> TutorChatResponse:
        """Retrieve context and generate a Vietnamese tutor answer."""
        graph_sources = self._neo4j_reader.search(request.message, level="N5", limit=5)
        vector_sources = self._qdrant_client.search(request.message, level="N5", limit=5)
        sources = self._merge_sources(vector_sources, graph_sources, limit=8)
        answer = self._llm_client.generate_tutor_answer(request.message, sources)
        confidence = 0.7 if sources else 0.3
        return TutorChatResponse(answer=answer, sources=sources, confidence=confidence)

    def _merge_sources(self, *source_groups, limit: int):
        seen: set[tuple[str, str, str]] = set()
        merged = []
        for source_group in source_groups:
            for source in source_group:
                key = (source.type, source.title, source.reading)
                if key in seen:
                    continue
                seen.add(key)
                merged.append(source)
                if len(merged) >= limit:
                    return merged
        return merged
