from functools import lru_cache

from app.application.services.assessment_service_impl import AssessmentServiceImpl
from app.application.services.planner_service_impl import PlannerServiceImpl
from app.application.services.tutor_service_impl import TutorServiceImpl
from app.config.settings import get_settings
from app.domain.services.assessment_service import AssessmentService
from app.domain.services.planner_service import PlannerService
from app.domain.services.tutor_service import TutorService
from app.infrastructure.graphdb.neo4j_reader import Neo4jReader
from app.infrastructure.llm.langchain_client import LangChainClient
from app.infrastructure.vectordb.qdrant_client import QdrantVectorClient


@lru_cache
def get_neo4j_reader() -> Neo4jReader:
    """Return a shared Neo4j reader."""
    return Neo4jReader(get_settings())


@lru_cache
def get_llm_client() -> LangChainClient:
    """Return a shared LLM adapter."""
    return LangChainClient(get_settings())


@lru_cache
def get_qdrant_client() -> QdrantVectorClient:
    """Return a shared Qdrant vector retrieval client."""
    return QdrantVectorClient(get_settings())


@lru_cache
def get_tutor_service() -> TutorService:
    """Return the Tutor Agent service."""
    return TutorServiceImpl(get_neo4j_reader(), get_qdrant_client(), get_llm_client())


@lru_cache
def get_planner_service() -> PlannerService:
    """Return the Planner Agent service."""
    return PlannerServiceImpl()


@lru_cache
def get_assessment_service() -> AssessmentService:
    """Return the Assessment Agent service."""
    return AssessmentServiceImpl()
