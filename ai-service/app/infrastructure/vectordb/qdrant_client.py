from app.config.settings import Settings
from app.domain.schemas import KnowledgeSource
from app.infrastructure.vectordb.text_embedder import TextEmbedder, create_text_embedder

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import FieldCondition, Filter, MatchValue
except ImportError:  # pragma: no cover - allows syntax checks before dependencies are installed.
    QdrantClient = None
    FieldCondition = None
    Filter = None
    MatchValue = None


class QdrantVectorClient:
    """Vector retrieval adapter backed by Qdrant."""

    def __init__(self, settings: Settings, embedder: TextEmbedder | None = None) -> None:
        self._settings = settings
        self._embedder = embedder or create_text_embedder(settings)
        self._client = None

    def is_configured(self) -> bool:
        """Return whether a Qdrant URL is configured."""
        return bool(self._settings.qdrant_url)

    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
        """Search Qdrant for semantically related learning content."""
        if not query.strip() or QdrantClient is None:
            return []

        try:
            response = self._get_client().query_points(
                collection_name=self._settings.qdrant_collection,
                query=self._embedder.embed(query),
                query_filter=self._level_filter(level),
                limit=max(limit * 10, 30),
                with_payload=True,
                score_threshold=0.1,
            )
        except Exception:
            return []

        ranked_points = self._rerank(query, response.points)
        sources: list[KnowledgeSource] = []
        for point in ranked_points[:limit]:
            payload = point.payload or {}
            sources.append(
                KnowledgeSource(
                    type=str(payload.get("type", "")),
                    id=str(payload.get("id", "")),
                    title=str(payload.get("title", "")),
                    reading=str(payload.get("reading", "")),
                    meaningVi=str(payload.get("meaningVi", "")),
                    meaningEn=str(payload.get("meaningEn", "")),
                    level=str(payload.get("level", "")),
                    source=str(payload.get("source", "Qdrant")),
                )
            )
        return sources

    def _rerank(self, query: str, points) -> list:
        query_terms = self._embedder.terms(query)
        raw_query = query.lower()
        normalized_query = self._embedder.normalized_text(query)

        def score(point) -> float:
            payload = point.payload or {}
            text = str(payload.get("text", ""))
            doc_terms = self._embedder.terms(text)
            overlap = 0.0
            if query_terms and doc_terms:
                overlap = len(query_terms & doc_terms) / (len(query_terms) ** 0.5 * len(doc_terms) ** 0.5)

            normalized_doc = self._embedder.normalized_text(
                " ".join(
                    [
                        str(payload.get("title", "")),
                        str(payload.get("reading", "")),
                        str(payload.get("meaningVi", "")),
                        str(payload.get("meaningEn", "")),
                        text,
                    ]
                )
            )
            exact_bonus = 0.4 if normalized_query and normalized_query in normalized_doc else 0.0
            intent_bonus = self._intent_bonus(raw_query, normalized_query, normalized_doc)
            return float(point.score or 0.0) + overlap + exact_bonus + intent_bonus

        return sorted(points, key=score, reverse=True)

    def _intent_bonus(self, raw_query: str, normalized_query: str, normalized_doc: str) -> float:
        bonus = 0.0
        eat_query = any(term in raw_query for term in ["\u0103n", "an ", "eat", "taberu", "tabemasu"])
        if eat_query:
            if any(term in normalized_doc for term in ["eat", "taberu", "tabemasu", "\u98df\u3079"]):
                bonus += 5.0
            else:
                bonus -= 1.0

        desu_query = any(term in raw_query for term in ["desu", "\u3067\u3059"])
        if desu_query:
            if any(term in normalized_doc for term in ["desu", "\u3067\u3059", "to be"]):
                bonus += 3.0
            else:
                bonus -= 0.5

        must_not_query = any(
            term in raw_query
            for term in ["must not", "khong duoc", "kh\u00f4ng \u0111\u01b0\u1ee3c", "ikenai", "\u3044\u3051\u306a\u3044"]
        )
        if must_not_query:
            if any(
                term in normalized_doc
                for term in ["must not", "ikenai", "\u3044\u3051\u306a\u3044", "kh\u00f4ng \u0111\u01b0\u1ee3c"]
            ):
                bonus += 3.0
            else:
                bonus -= 0.5
        return bonus

    def close(self) -> None:
        """Close the Qdrant client and embedder if they support explicit closing."""
        if self._client is not None and hasattr(self._client, "close"):
            self._client.close()
        if hasattr(self._embedder, "close"):
            self._embedder.close()
        self._client = None

    def _get_client(self):
        if self._client is None:
            self._client = QdrantClient(url=self._settings.qdrant_url)
        return self._client

    def _level_filter(self, level: str):
        normalized = level.strip().upper()
        if not normalized or Filter is None:
            return None
        return Filter(
            must=[
                FieldCondition(
                    key="level",
                    match=MatchValue(value=normalized),
                )
            ]
        )
