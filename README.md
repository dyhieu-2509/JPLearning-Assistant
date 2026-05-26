# JPLearning Assistant

Web-based virtual assistant for Japanese learning, focused on JLPT N5/N4 for Vietnamese university students.

## Current Phase

Timeline status on 25/05/2026: **Phase 3 — Backend & Graph RAG**.

Implemented scaffold:

- Spring Boot backend under `backend/`
- FastAPI AI service under `ai-service/`
- Neo4j/PostgreSQL/Qdrant Docker Compose services
- REST endpoints for health, knowledge lookup, tutor chat, planner, and assessment scaffold

## Run Infrastructure

```powershell
docker compose up -d postgres neo4j qdrant
```

Generate or refresh the Neo4j seed file:

```powershell
python ai-service/data_loader.py --dry-run
```

## Run AI Service Locally

```powershell
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```powershell
curl http://localhost:8000/api/v1/health
```

## Run Backend Locally

```powershell
cd backend
mvn spring-boot:run
```

Useful endpoints:

- `GET /api/v1/health`
- `GET /api/v1/knowledge/vocabulary?q=たべる&level=N5`
- `GET /api/v1/knowledge/grammar?q=desu&level=N5`
- `GET /api/v1/knowledge/kanji?q=日&level=N5`
- `POST /api/v1/chat`

## Run With Docker Compose

```powershell
docker compose up --build
```

Backend is exposed at `http://localhost:8080`. The AI service is internal to Docker Compose and is called by the backend through `http://ai-service:8000`.
