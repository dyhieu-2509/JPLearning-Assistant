# JPLearning Assistant

Web-based virtual assistant for Japanese learning, focused on JLPT N5/N4 for Vietnamese university students.

## Current Phase

Timeline status on 28/05/2026: **Frontend MVP integration** after Phase 3 backend/RAG.

Implemented:

- Spring Boot backend under `backend/`
- FastAPI AI service under `ai-service/`
- React/Vite frontend under `frontend/`
- Neo4j/PostgreSQL/Qdrant Docker Compose services
- REST endpoints for auth, knowledge lookup, tutor chat, personalization dashboard, flashcards, assessment, and planner

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

## Run Frontend Locally

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000` and proxies `/api` to `http://localhost:8080`.

Build check:

```powershell
cd frontend
npm run build
```

## Frontend Architecture

The frontend follows a feature-based structure inspired by large React product repositories and Bulletproof React-style boundaries:

```text
frontend/src/
├── app/                 # app routes, providers, protected layout
├── features/            # feature-owned views and feature logic
│   ├── auth/
│   ├── dashboard/
│   ├── chat/
│   ├── flashcards/
│   ├── assessment/
│   └── planner/
├── pages/               # thin route entry files only; no business logic
└── shared/
    ├── api.ts           # API request client only
    ├── models.ts        # shared API/domain models
    ├── components.tsx   # reusable UI primitives
    └── assets.ts        # shared asset imports
```

Rules:

- Learner app lives under `/learner`; admin console lives under `/admin`.
- Admin and learner routes must use separate layouts and navigation. Do not mix admin tools into learner pages.
- Admin routes must be protected by role checks before admin APIs are added.
- Page files in `src/pages` only re-export feature views.
- Reusable UI such as buttons, panels, page headers, empty states, metric tiles, chips, and shared cards lives in `src/shared/components.tsx`.
- API DTO/domain types live in `src/shared/models.ts`, not inside page files.
- Feature folders may own feature-specific behavior, but shared UI and cross-feature helpers must move to `shared`.

Reference:

- https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md

## Google OAuth2 Local Setup

Google OAuth2 is configured through environment variables. Do not commit the downloaded Google `client_secret_*.json`; it is ignored by `.gitignore`.

When a Google OAuth client JSON is present locally, copy these values into `.env`:

```env
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=<client_id>
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=<client_secret>
FRONTEND_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

For frontend-only overrides, use `frontend/.env.local`. In local dev, `VITE_OAUTH_BASE_URL` defaults to `http://localhost:8080`, so it is optional.

The Google redirect URI must include:

```text
http://localhost:8080/login/oauth2/code/google
```

For local frontend development, add this JavaScript origin if Google asks for browser origins:

```text
http://localhost:3000
```

Frontend Google login starts at:

```text
http://localhost:8080/oauth2/authorization/google
```

Do not start the OAuth authorization request through the Vite dev proxy. Spring Security stores the OAuth `state` in a backend session cookie, so the start URL and callback URL must stay on the backend origin (`localhost:8080`) during local development.
