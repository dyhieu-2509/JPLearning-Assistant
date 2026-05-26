# Phase 3 Status — Backend & Graph RAG

Date: 25/05/2026

## Goal

Build the backend foundation for the thesis timeline phase **23/05 → 05/06**:

- REST API with Spring Boot.
- PostgreSQL and Neo4j configuration.
- Internal REST connection from Spring Boot to Python FastAPI.
- Initial Graph RAG retrieval path.

## Completed

- Created Spring Boot project scaffold in `backend/`.
- Added thin controllers under `/api/v1`.
- Added application services and repository ports.
- Added Neo4j read adapter for vocabulary, grammar, and kanji lookup.
- Added Python FastAPI structure in `ai-service/app`.
- Added Tutor, Planner, and Assessment service contracts and initial implementations.
- Added Dockerfiles and updated Docker Compose for backend + AI service.
- Added focused unit tests for backend services and AI tutor service.

## Next Work

1. Import `docs/seed_knowledge_graph.cypher` into Neo4j and verify lookup endpoints against real data.
2. Add Qdrant indexing script for grammar/vocabulary embeddings.
3. Replace the mock LLM adapter with Gemini/OpenAI provider configuration.
4. Persist chat history and progress in PostgreSQL.
5. Add integration tests for `/api/v1/knowledge/*` and `/api/v1/chat`.
