# Phase 3 Status — Backend & Graph RAG

Date: 27/05/2026

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
- Added backend Auth/JWT foundation:
  - Local register/login/refresh/logout APIs.
  - Unified `users`, `user_auth_providers`, and `refresh_tokens` model.
  - JWT bearer filter and stateless Spring Security configuration.
  - Google OAuth2 success handler with controlled account-link-required behavior.
- Added chatbot personalization data foundation:
  - Persisted chat sessions and user/assistant messages by authenticated user.
  - Stored assistant RAG sources and confidence for later evaluation/personalization.
  - Returned `sessionId` from chat responses and added session history endpoints.
  - Recorded retrieved sources as progress exposure without increasing mastery.
- Split persistence packages:
  - JPA repositories under `infrastructure.persistence.jpa`.
  - Neo4j adapter under `infrastructure.persistence.neo4j`.
  - Excluded Spring Data Neo4j repository auto-configuration because the project uses `Neo4jClient`.
- Tightened personalization progress signals:
  - Learner personalization APIs now use `/api/v1/personalization/me/...` and resolve the user from JWT.
  - Chatbot/RAG sources are recorded as exposure count only.
  - Mastery changes only through structured learning signals from quiz, assessment, flashcard, or explicit feedback.
- Imported `docs/seed_knowledge_graph.cypher` into local Neo4j and verified backend lookup endpoints:
  - Vocabulary: 3156 nodes.
  - GrammarPoint: 215 nodes.
  - Kanji: 245 nodes.
  - Lesson: 50 nodes.
- Rebuilt Qdrant vector index with local Ollama `bge-m3` embeddings:
  - Collection: `jp_learning_knowledge`.
  - Vector size: 1024.
  - Points: 4498.
  - Backend chat verified `eat trong tieng Nhat la gi?` returns `食べます` as the first source and records exposure without changing mastery.
- Added backend API integration tests with MockMvc + H2:
  - Auth register/login/refresh/logout JWT contract.
  - Google account-link confirmation with signed `linkToken` and local password.
  - Public knowledge vocabulary lookup route.
  - Protected chat flow with persisted session/messages and exposure-only progress update.
  - Flashcard review signal route.
  - Flashcard deck/card lifecycle with KG auto-generation, due list, card review, and progress update.
  - Assessment session start/submit route with hidden answer key and resubmission rejection.
- Added Google account-link confirmation flow:
  - OAuth conflict redirect includes short-lived signed `linkToken`.
  - `POST /api/v1/auth/google/link` verifies local password before adding provider `GOOGLE`.
  - Endpoint returns the same unified `AuthResponse` JWT contract.
- Added flashcard review signal API:
  - `POST /api/v1/flashcards/review` requires JWT.
  - Maps `AGAIN/HARD/GOOD/EASY` ratings to structured `FLASHCARD` learning signals.
  - Updates mastery through `PersonalizationService` instead of direct client-controlled score writes.
- Added flashcard deck/card management APIs:
  - `GET /api/v1/flashcards/decks` and `POST /api/v1/flashcards/decks`.
  - `GET /api/v1/flashcards/decks/{deckId}/cards`.
  - `GET /api/v1/flashcards/review/due`.
  - Deck creation can auto-generate cards from Knowledge Graph by `level + category`.
  - `POST /api/v1/flashcards/review` now supports `cardId + rating`, updates card SRS interval and records `FLASHCARD` learning signals.
- Added assessment session API:
  - `POST /api/v1/assessment/sessions` starts a protected quiz/placement session.
  - Backend stores AI-generated answer keys server-side and returns public questions without answers.
  - `POST /api/v1/assessment/sessions/{sessionId}/submit` grades with the stored key, rejects resubmission, and records `ASSESSMENT` learning signals.
- Added personalized planner endpoint:
  - `POST /api/v1/planner/recommend` requires JWT.
  - Builds context from learner profile, weak progress, due flashcards, recent chat topics, and latest submitted assessment.
  - Calls Python planner for the base roadmap, then injects backend-personalized tasks for due cards, weak knowledge, assessment mistakes, and recent chat follow-up.
  - Persists each generated plan and its items under the authenticated learner.
  - Added `GET /api/v1/planner/plans`, `GET /api/v1/planner/plans/{planId}`, and `POST /api/v1/planner/plans/{planId}/items/{itemId}/complete`.
- Added learner dashboard analytics endpoint:
  - `GET /api/v1/personalization/me/dashboard` requires JWT.
  - Summarizes profile, progress totals, mastered/weak counts, average mastery, due cards, assessment scores/weak areas, and chat activity.
  - Uses server-side repositories only; dashboard reads personalization state without mutating mastery or learning schedules.

## Next Work

1. Add frontend MVP screens for auth, chat, dashboard, flashcards, assessment, and planner.
2. Add admin/question-bank APIs after learner MVP loop is stable.
3. Add export/demo seed script for a reproducible thesis MVP scenario.
