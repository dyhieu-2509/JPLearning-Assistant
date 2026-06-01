# JPLearning Assistant — Project Development Guide

## Tổng quan Dự án

Web-based Virtual Assistant hỗ trợ học tiếng Nhật (JLPT N5/N4) cho sinh viên Việt Nam.
Sử dụng Multi-Agent + Knowledge Graph + RAG.

---

## Kiến trúc: Hybrid (Spring Boot + Python AI Service)

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│              hoặc Streamlit/Gradio (prototype)           │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│            Java Spring Boot (Main Backend)               │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│  │   Auth   │ │   User   │ │  Progress │ │    KG     │ │
│  │ Module   │ │  Module  │ │  Tracker  │ │  Module   │ │
│  └──────────┘ └──────────┘ └───────────┘ └───────────┘ │
│       │              │            │             │        │
│  Spring Security  Spring Data  Spring Data  Spring Data  │
│                   JPA          JPA          Neo4j        │
└──────┬──────────────┬────────────┬─────────────┬────────┘
       │              │            │             │
  ┌────▼────┐   ┌─────▼────┐  ┌───▼───┐   ┌────▼────┐
  │PostgreSQL│   │PostgreSQL│  │Postgre│   │  Neo4j  │
  │  (Auth)  │   │ (Users)  │  │(Progr)│   │  (KG)   │
  └─────────┘   └──────────┘  └───────┘   └─────────┘

┌─────────────────────────────────────────────────────────┐
│          Python FastAPI (AI Microservice)                 │
│  ┌───────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │   Tutor   │  │  Planner  │  │    Assessment      │   │
│  │  (RAG)    │  │  (Agent)  │  │    (Quiz Gen)      │   │
│  └─────┬─────┘  └─────┬─────┘  └────────┬───────────┘   │
│        │              │                  │               │
│   LangChain      LangChain         LangChain            │
│   + Qdrant       + Neo4j           + Neo4j              │
└────────┬──────────────┬──────────────────┬──────────────┘
         │              │                  │
    ┌────▼────┐   ┌─────▼────┐      ┌─────▼─────┐
    │ Qdrant  │   │  Neo4j   │      │ LLM API   │
    │(Vectors)│   │  (read)  │      │(Gemini/   │
    └─────────┘   └──────────┘      │ OpenAI)   │
                                    └───────────┘
```

### Phân chia trách nhiệm

| Layer | Technology | Trách nhiệm |
|---|---|---|
| **Main Backend** | Java 17+, Spring Boot 3 | Auth, User CRUD, Progress, KG management, API Gateway |
| **AI Service** | Python 3.11+, FastAPI | RAG, Tutoring, Planning, Assessment, LLM orchestration |
| **Relational DB** | PostgreSQL 15 | Users, progress, sessions, quiz results |
| **Graph DB** | Neo4j 5 | Knowledge Graph (vocab, grammar, kanji relationships) |
| **Vector DB** | Qdrant | Embeddings cho semantic search / RAG |
| **Frontend** | Streamlit (prototype) → React (production) | UI |

Qdrant indexing:

- Use `ai-service/index_qdrant.py` to build `jp_learning_knowledge`.
- For MVP retrieval quality, index with the same embedding provider used by `ai-service`.
- Current local target: Ollama `bge-m3`, `EMBEDDING_VECTOR_SIZE=1024`.
- On Windows/local Docker, prefer `--prefer-grpc` for indexing to avoid large HTTP/zstd response memory issues.

### Giao tiếp giữa 2 services

- Spring Boot gọi Python AI Service qua **REST HTTP** (internal network).
- Spring Boot dùng `WebClient` hoặc `RestTemplate`.
- Python AI Service **không expose ra ngoài** — chỉ Spring Boot truy cập.

---

## Tech Stack chi tiết

### Java Spring Boot (Main Backend)

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-web` | REST API |
| `spring-boot-starter-data-jpa` | PostgreSQL ORM |
| `spring-boot-starter-data-neo4j` | Neo4j integration |
| `spring-boot-starter-security` | Authentication |
| `spring-boot-starter-oauth2-client` | Google OAuth2 login |
| `jjwt` or `nimbus-jose-jwt` | JWT access/refresh token handling |
| `spring-boot-starter-validation` | Request validation |
| `springdoc-openapi` | Swagger/OpenAPI docs |
| `lombok` | Reduce getter/setter/constructor boilerplate in Java entities |
| `mapstruct` | DTO ↔ Entity mapping |

### Python FastAPI (AI Service)

| Package | Purpose |
|---|---|
| `fastapi` + `uvicorn` | REST API |
| `langchain` | RAG workflow, agent orchestration |
| `qdrant-client` | Vector search |
| `neo4j` | Graph DB queries (read-only) |
| `openai` / `google-genai` | LLM API calls |
| `pydantic` | Schema validation |

---

## Coding Standards

### Nguyên tắc bắt buộc (cả 2 services)

- **SOLID principles** — tuân thủ nghiêm ngặt.
- **DDD (Domain-Driven Design)** — tách rõ domain, application, infrastructure.
- **Controller KHÔNG có logic** — chỉ nhận request → gọi service → trả response.
- **Service là Interface** — `ServiceImpl` chứa business logic.
- **Clean Architecture** — dependency hướng vào domain.
- **DTO tách request/response** — request DTO nằm trong `application.dto.request`, response DTO nằm trong `application.dto.response`.
- **Exception handling tách riêng** — `@RestControllerAdvice` nằm trong `api.v1.handler`, controller nằm trong `api.v1.controller`.
- **Application port tách riêng** — outbound port nằm trong `application.port.out`, implementation adapter nằm trong `infrastructure`.
- **Application exception tách riêng** — exception nghiệp vụ/application nằm trong `application.exception`, không đặt trong `service`.
- **Auth thống nhất** — hỗ trợ cả system login (`email/password`) và Google login; cả hai đều map vào cùng `User` trong database và backend phát JWT thống nhất.
- **Lombok cho entity** — dùng `@Getter`, `@Setter` theo field cần update, `@NoArgsConstructor(access = AccessLevel.PROTECTED)` cho JPA entity. Không dùng `@Setter` toàn class nếu entity có `id`, audit fields hoặc invariant nghiệp vụ.

### Auth/JWT/Database

Auth phải được thiết kế ngay từ đầu để hỗ trợ 2 luồng đăng nhập:

1. **System login**: user đăng ký/đăng nhập bằng `email + password`.
2. **Google login**: user đăng nhập bằng Google OAuth2.

Quy tắc bắt buộc:

- Backend dùng **Spring Security stateless JWT** cho API protection.
- Cả local login và Google OAuth2 login đều trả về cùng format token: `accessToken`, `refreshToken`, `expiresIn`, `user`.
- Không tách user Google và user local thành 2 bảng user khác nhau. Dùng một bảng user chính, ví dụ `users`.
- Tài khoản đăng nhập qua provider được lưu ở bảng liên kết, ví dụ `user_auth_providers`.
- Password local phải hash bằng `BCryptPasswordEncoder`, không lưu plain text.
- Google OAuth2 chỉ lưu provider metadata cần thiết: `provider`, `providerUserId`, `email`, `displayName`, `avatarUrl`.
- Nếu Google email trùng user local đã tồn tại, xử lý bằng account linking có kiểm soát; không tạo user trùng.
- Account linking behavior:
  - `GOOGLE + sub` đã tồn tại: login thẳng vào user đã linked.
  - Email Google trùng user local và `email_verified=true`: yêu cầu xác nhận link bằng password local hoặc OTP, sau đó thêm provider `GOOGLE`.
  - Khi OAuth Google bắt buộc link, backend phát signed `linkToken` ngắn hạn qua redirect; endpoint link chỉ nhận `linkToken + password local`, không tin `providerUserId` thô từ client.
  - Email trùng nhưng local user chưa verified hoặc trạng thái bất thường: không auto-link, trả lỗi cần xác minh.
  - Email chưa tồn tại: tạo user mới với provider `GOOGLE`, `password_hash=null`.
- Sau khi link Google thành công, có thể dùng `picture` từ Google để cập nhật `users.avatar_url` và `student_profiles.avatar_url` nếu user chưa tự đặt avatar.
- Refresh token nên lưu hash trong database hoặc bảng session riêng để có thể revoke/logout.
- JWT secret, Google client id/secret, token TTL phải đọc từ env/config, không hardcode.
- Local Google OAuth phải bắt đầu trực tiếp ở backend origin, ví dụ `http://localhost:8080/oauth2/authorization/google`; không start qua Vite proxy vì OAuth `state` nằm trong backend session cookie và callback cũng về backend.
- API public tối thiểu: register, login, refresh, logout, OAuth2 callback/success endpoint, health.
- API link Google: `POST /api/v1/auth/google/link` với `linkToken + password`, trả cùng `AuthResponse` JWT nếu xác nhận thành công.
- API còn lại mặc định yêu cầu JWT, trừ endpoint được whitelist rõ trong `SecurityConfig`.

### Personalization Data Contract

Personalization phải dựa trên dữ liệu có thể kiểm chứng, không suy luận mơ hồ:

- Chatbot data phải lưu theo `chat_sessions` và `chat_messages`.
- Mỗi message assistant phải lưu `sources`, `confidence`, `contextTopic`, `sessionId`, `userId`.
- `sources` từ RAG/KG được ghi vào progress như **exposure**; không được tự tăng mastery như câu trả lời đúng.
- Exposure từ chatbot/knowledge browsing chỉ được tăng `exposureCount` và `lastExposedAt`; không cho phép client tự set `masteryScore`.
- Mastery chỉ tăng/giảm khi có tín hiệu đánh giá rõ: quiz answer, flashcard review, placement/assessment result, hoặc explicit feedback.
- Learning signal phải đi qua API có cấu trúc `source` + `result`: `QUIZ/ASSESSMENT` chỉ nhận `CORRECT|WRONG`, `FLASHCARD` chỉ nhận `AGAIN|HARD|GOOD|EASY`.
- Assessment/quiz session phải lưu answer key ở backend (`assessment_sessions.questions_json`); response start session không được trả field `answer`.
- Assessment submit dùng `/api/v1/assessment/sessions/{sessionId}/submit`, chấm bằng answer key đã lưu và chỉ sau đó mới ghi `ASSESSMENT` learning signal.
- Flashcard review dùng `cardId + rating` khi có card trong deck; backend cập nhật SRS schedule (`easinessFactor`, `intervalDays`, `repetitions`, `nextReviewAt`) và đồng thời ghi `FLASHCARD` learning signal.
- Planner endpoint `/api/v1/planner/recommend` phải tổng hợp context thật từ profile, weak progress, due flashcards, recent chat topics, latest assessment rồi mới gọi/merge Python planner result.
- Planner recommendations phải persist thành `study_plans` + `study_plan_items`; learner có thể list plan, xem chi tiết, và mark item completed bằng JWT user.
- Dashboard endpoint `/api/v1/personalization/me/dashboard` chỉ đọc dữ liệu cá nhân hóa server-side: profile, progress, due flashcards, assessment summary, chat activity; không được mutate mastery/schedule.
- Planner/roadmap phải ưu tiên: learner profile, weak progress, recent chat topics, quiz/flashcard history.
- Không dùng `request.userId` từ client để cá nhân hóa khi đã có JWT; user id phải lấy từ authenticated principal.
- Learner personalization REST API dùng `/api/v1/personalization/me/...`; không dùng `/users/{userId}` cho luồng learner thông thường.

Database auth target:

```text
users
- id
- email
- display_name
- avatar_url
- password_hash nullable
- role
- status
- created_at
- updated_at

user_auth_providers
- id
- user_id
- provider              # LOCAL, GOOGLE
- provider_user_id      # local email or Google sub
- email
- display_name
- avatar_url
- created_at
- updated_at

refresh_tokens
- id
- user_id
- token_hash
- expires_at
- revoked_at nullable
- created_at
```

### Cấu trúc Spring Boot

```
backend/
├── src/main/java/com/jpassistant/
│   ├── JpAssistantApplication.java
│   ├── config/                        # Security, JWT, OAuth2, WebClient, Neo4j config
│   ├── domain/                        # Entities, Value Objects
│   │   ├── auth/
│   │   │   ├── User.java
│   │   │   ├── UserAuthProvider.java
│   │   │   ├── RefreshToken.java
│   │   │   └── AuthProvider.java
│   │   ├── knowledge/
│   │   │   ├── KnowledgeItem.java
│   │   │   └── KnowledgeGraphRepository.java
│   │   ├── personalization/
│   │   │   ├── StudentProfile.java    # JPA entity, includes avatarUrl
│   │   │   └── KnowledgeProgress.java # JPA entity, custom mastery setter
│   │   ├── assessment/
│   │   │   └── AssessmentSession.java # JPA entity, stores server-side answer key
│   │   ├── planner/
│   │   │   ├── StudyPlan.java
│   │   │   └── StudyPlanItem.java
│   │   └── flashcard/
│   │       ├── FlashcardDeck.java
│   │       └── FlashcardCard.java     # JPA entity, stores SRS schedule
│   ├── application/
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── ChatService.java       # Interface
│   │   │   ├── KnowledgeService.java  # Interface
│   │   │   ├── AssessmentService.java
│   │   │   ├── FlashcardService.java
│   │   │   ├── PlannerService.java
│   │   │   ├── DashboardService.java
│   │   │   ├── PersonalizationService.java
│   │   │   └── impl/
│   │   │       ├── AuthServiceImpl.java
│   │   │       ├── ChatServiceImpl.java
│   │   │       ├── KnowledgeServiceImpl.java
│   │   │       ├── AssessmentServiceImpl.java
│   │   │       ├── FlashcardServiceImpl.java
│   │   │       ├── PlannerServiceImpl.java
│   │   │       ├── DashboardServiceImpl.java
│   │   │       └── PersonalizationServiceImpl.java
│   │   ├── port/
│   │   │   └── out/
│   │   │       └── AiServiceClient.java  # Outbound port to Python AI Service
│   │   ├── exception/
│   │   │   └── InvalidRequestException.java
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── RegisterRequest.java
│   │   │   │   ├── RefreshTokenRequest.java
│   │   │   │   ├── ChatRequest.java
│   │   │   │   ├── AiTutorChatRequest.java
│   │   │   │   ├── AiPlannerRequest.java
│   │   │   │   ├── StudentProfileRequest.java
│   │   │   │   ├── PlannerRecommendRequest.java
│   │   │   │   ├── AssessmentStartRequest.java
│   │   │   │   ├── AssessmentSubmitRequest.java
│   │   │   │   ├── FlashcardDeckCreateRequest.java
│   │   │   │   ├── FlashcardCardCreateRequest.java
│   │   │   │   ├── FlashcardReviewRequest.java
│   │   │   │   ├── KnowledgeProgressRequest.java
│   │   │   │   ├── KnowledgeReviewRequest.java
│   │   │   │   └── LearningSignalRequest.java
│   │   │   └── response/
│   │   │       ├── AuthResponse.java
│   │   │       ├── UserResponse.java
│   │   │       ├── ChatResponse.java
│   │   │       ├── SourceResponse.java
│   │   │       ├── ApiErrorResponse.java
│   │   │       ├── AiPlannerResponse.java
│   │   │       ├── PlannerRecommendationResponse.java
│   │   │       ├── PlannerContextResponse.java
│   │   │       ├── SavedStudyPlanResponse.java
│   │   │       ├── SavedStudyPlanItemResponse.java
│   │   │       ├── LearnerDashboardResponse.java
│   │   │       ├── AssessmentStartResponse.java
│   │   │       ├── AssessmentSubmitResponse.java
│   │   │       ├── FlashcardDeckResponse.java
│   │   │       ├── FlashcardCardResponse.java
│   │   │       ├── FlashcardReviewResponse.java
│   │   │       ├── KnowledgeItemResponse.java
│   │   │       ├── StudentProfileResponse.java
│   │   │       └── KnowledgeProgressResponse.java
│   │   └── mapper/
│   │       └── UserMapper.java        # MapStruct
│   ├── infrastructure/                # External adapters
│   │   ├── persistence/
│   │   │   ├── jpa/
│   │   │   │   ├── UserJpaRepository.java
│   │   │   │   ├── UserAuthProviderJpaRepository.java
│   │   │   │   ├── RefreshTokenJpaRepository.java
│   │   │   │   ├── ChatSessionJpaRepository.java
│   │   │   │   ├── ChatMessageJpaRepository.java
│   │   │   │   ├── StudentProfileJpaRepository.java
│   │   │   │   ├── KnowledgeProgressJpaRepository.java
│   │   │   │   ├── AssessmentSessionJpaRepository.java
│   │   │   │   ├── FlashcardDeckJpaRepository.java
│   │   │   │   ├── FlashcardCardJpaRepository.java
│   │   │   │   ├── StudyPlanJpaRepository.java
│   │   │   │   └── StudyPlanItemJpaRepository.java
│   │   │   └── neo4j/
│   │   │       └── Neo4jKnowledgeRepository.java
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── GoogleOAuth2SuccessHandler.java
│   │   └── external/
│   │       └── AiServiceClientImpl.java  # WebClient → Python
│   └── api/
│       └── v1/
│           ├── controller/            # Thin REST controllers
│           │   ├── AuthController.java
│           │   ├── ChatController.java
│           │   ├── KnowledgeController.java
│           │   ├── AssessmentController.java
│           │   ├── FlashcardController.java
│           │   ├── PlannerController.java
│           │   ├── DashboardController.java
│           │   ├── PersonalizationController.java
│           │   └── HealthController.java
│           └── handler/
│               └── GlobalExceptionHandler.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/                  # Flyway migrations
└── pom.xml
```

### Cấu trúc Python AI Service

```
ai-service/
├── app/
│   ├── main.py                        # FastAPI entrypoint
│   ├── config/
│   │   └── settings.py                # Pydantic Settings
│   ├── domain/
│   │   └── services/                  # Service interfaces (ABC)
│   │       ├── tutor_service.py
│   │       ├── planner_service.py
│   │       └── assessment_service.py
│   ├── application/
│   │   └── services/                  # ServiceImpl
│   │       ├── tutor_service_impl.py
│   │       ├── planner_service_impl.py
│   │       └── assessment_service_impl.py
│   ├── infrastructure/
│   │   ├── llm/
│   │   │   └── langchain_client.py
│   │   ├── vectordb/
│   │   │   └── qdrant_client.py
│   │   └── graphdb/
│   │       └── neo4j_reader.py        # Read-only
│   └── api/
│       └── v1/
│           ├── chat_controller.py
│           ├── planner_controller.py
│           └── assessment_controller.py
├── tests/
├── pyproject.toml
└── Dockerfile
```

---

## Datasets có sẵn

| Dataset | Đường dẫn | Mô tả |
|---|---|---|
| Minna no Nihongo | `datasets/MinnaNoDS/minna-no-ds.yaml` | Bài học, từ vựng, ngữ pháp |
| JLPT Vocabulary | `datasets/JLPT_Vocabulary/data/vocab/results/` | Từ vựng N1-N5 (CSV+JSON) |
| JLPT Kanji | `datasets/JLPT_Vocabulary/data/kanji/results/` | Kanji N1-N5 |
| JLPT Grammar | `JLPT_Grammar_Full.csv` | Ngữ pháp N5-N1 (EN + VI) |
| JaVi Corpus | `datasets/JaViCorpus/` | Parallel corpus Nhật-Việt |

> **Scope:** Chỉ sử dụng data N5/N4.

---

## 4 Modules

| Module | Service | Mô tả |
|---|---|---|
| **Knowledge Graph** | Spring Boot (Neo4j) | CRUD + query vocab/grammar/kanji relationships |
| **Tutor** | Python AI | RAG chatbot, trả lời ngữ pháp bằng tiếng Việt |
| **Planner** | Python AI | Study recommendations theo level + goals |
| **Assessment** | Python AI | Quiz generation + placement test |

---

## Docker Compose (Target)

```yaml
services:
  backend:        # Java Spring Boot — port 8080
  ai-service:     # Python FastAPI — port 8000 (internal only)
  postgres:       # PostgreSQL — port 5432
  neo4j:          # Neo4j — port 7474/7687
  qdrant:         # Qdrant — port 6333
  frontend:       # Streamlit — port 8501
```

---

## Quy tắc làm việc

0. **Nguồn sự thật khi implement** — trước khi code phải đọc và đối chiếu đồng thời:
   - `docs/SRS.md`: yêu cầu hệ thống, actor, use case, functional/non-functional requirements.
   - `Thesis_Proposal_BuiDuyHieu.md`: mục tiêu luận văn, phạm vi nghiên cứu, timeline, tiêu chí đánh giá.
   - `claude.md`: kiến trúc, coding standards, package conventions, auth/account-linking rules.
   Nếu 3 tài liệu có điểm lệch nhau, ưu tiên làm rõ để giữ MVP nhất quán thay vì implement theo một file đơn lẻ.
1. **Mọi thay đổi phải có test** — unit test cho service, integration test cho API.
2. **Type safety** — Java: no raw types. Python: type hints bắt buộc.
3. **Docstrings/Javadoc** — tất cả public methods.
4. **Error handling** — custom exceptions, xử lý tập trung (`api/v1/handler` / `error_handlers.py`).
5. **Environment variables** — không hardcode secrets. Dùng `application.yml` + `.env`.
6. **DB migrations** — Flyway (Java), Alembic (Python nếu cần).
7. **Git commits** — conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`).
8. **API versioning** — tất cả endpoints bắt đầu bằng `/api/v1/`.
9. **Lombok** — dùng để giảm boilerplate entity, nhưng setter phải có chủ đích; giữ setter thủ công khi field có validation/invariant như `KnowledgeProgress.setMasteryScore`.
10. **MVP 100% mindset** — khi chọn task tiếp theo, ưu tiên luồng end-to-end có thể demo được theo SRS và Thesis Proposal: auth → personalization → knowledge retrieval → tutor chat/RAG → progress tracking → assessment/planner. Không tối ưu cục bộ làm lệch khỏi MVP.
11. **Persistence package split** — JPA repositories nằm trong `infrastructure.persistence.jpa`, Neo4j adapter nằm trong `infrastructure.persistence.neo4j`. Vì không dùng Spring Data Neo4j repositories, exclude `Neo4jRepositoriesAutoConfiguration` và `Neo4jReactiveRepositoriesAutoConfiguration`; chỉ dùng `Neo4jClient`.
12. **MVP execution cadence** — timeline triển khai theo mốc thesis từ `19/05/2026` đến hết `27/05/2026`, chia thành các chức năng/task nhỏ có thể test/demo độc lập. Mục tiêu khoảng 5 task-level commit/ngày; nghĩa là trong mỗi ngày phải có nhiều commit nhỏ theo file/chức năng, không gom thành 1 commit lớn theo ngày. Mỗi commit chỉ chứa một chức năng, bug fix, refactor hoặc docs update rõ ràng.
13. **Commit & push per task, not batched** — sau khi hoàn tất từng chức năng/task, cập nhật `claude.md` nếu contract/trạng thái thay đổi, commit đúng các file thuộc task đó, rồi push ngay lên remote branch hiện tại trước khi chuyển sang task tiếp theo. Không tích nhiều commit local để push một lượt cuối ngày/cuối phase, và không commit lẫn thay đổi ngoài phạm vi task vừa làm.
14. **No invented product rules** — `claude.md` chỉ được cập nhật bằng yêu cầu từ SRS, Thesis Proposal, quyết định đã được user xác nhận, hoặc contract kỹ thuật đã implement và verify. Nếu cần thêm rule mới ảnh hưởng nghiệp vụ/cá nhân hóa, phải làm rõ trước.
15. **Frontend architecture** — React frontend dùng feature-based structure tham khảo các product repository lớn/Bulletproof React: `app` cho route/provider/layout, `features` cho từng domain, `shared` cho API client, models, reusable components/assets, và `pages` chỉ là route entry mỏng. Không code business/API logic trong `pages`; không tạo button/card/panel/chip/form controls dùng chung trong page hoặc feature nếu có thể đặt ở `shared/components`.

### Commit convention

Commit message dùng convention kiểu Conventional Commits/Angular để dễ grep log, sinh changelog và review theo từng loại thay đổi.

Format bắt buộc:

```text
<type>(<scope>): <summary>
```

Quy tắc:

- `type` bắt buộc, viết thường.
- `scope` nên có khi commit thuộc module rõ ràng: `backend`, `ai`, `auth`, `chat`, `personalization`, `assessment`, `flashcard`, `planner`, `dashboard`, `frontend`, `docs`, `infra`, `test`.
- `summary` dùng tiếng Anh ngắn gọn, dạng imperative, không viết hoa chữ đầu nếu không cần, không chấm cuối câu.
- Mỗi commit chỉ chứa một task nhỏ có thể review độc lập.
- Breaking change dùng `!`: `feat(auth)!: change token contract`, và mô tả thêm footer `BREAKING CHANGE: ...`.
- Hotfix chỉ dùng khi sửa lỗi khẩn cấp ảnh hưởng demo/runtime; bug bình thường dùng `fix`.

Allowed commit types:

| Type | Khi dùng | Ví dụ |
|---|---|---|
| `feat` | Thêm chức năng/API/flow mới | `feat(chat): persist RAG sources` |
| `fix` | Sửa bug thông thường | `fix(planner): avoid duplicate weak items` |
| `hotfix` | Sửa lỗi khẩn cấp cần đẩy ngay | `hotfix(auth): reject expired refresh tokens` |
| `refactor` | Đổi cấu trúc code không đổi behavior | `refactor(backend): move DTOs into response package` |
| `perf` | Cải thiện hiệu năng | `perf(knowledge): limit Neo4j traversal depth` |
| `test` | Thêm/sửa test | `test(assessment): cover resubmission rejection` |
| `docs` | Sửa tài liệu | `docs(srs): align MVP endpoints` |
| `style` | Format/code style, không đổi logic | `style(backend): format controller imports` |
| `chore` | Bảo trì repo/tooling nhỏ | `chore(repo): update gitignore entries` |
| `build` | Build system/dependencies | `build(backend): add H2 test dependency` |
| `ci` | CI/CD workflow | `ci(github): add backend test workflow` |
| `revert` | Revert commit trước đó | `revert: revert feat(planner): add saved plans` |
| `security` | Vá lỗ hổng/bảo mật không phù hợp `fix` | `security(auth): rotate weak JWT secret default` |

Các lệnh check nhanh:

```bash
git log --oneline --grep='^feat'
git log --oneline --grep='^hotfix'
git log --oneline --grep='^fix'
git log --pretty=format:'%ad %h %s' --date=short
git log --pretty=format:'%ad %s' --date=short | sort
```

### MVP delivery plan (19/05/2026 - 27/05/2026)

| Ngày | Trọng tâm | Task-level commit mục tiêu |
|---|---|---|
| 19/05/2026 | Audit backend MVP, chuẩn hóa package/API contract | backend fixes, tests, docs |
| 20/05/2026 | Auth/JWT, Google linking, user/profile foundation | auth flow, profile persistence, tests |
| 21/05/2026 | Knowledge retrieval, Neo4j/Qdrant indexing, RAG smoke | KG fixes, vector smoke, docs |
| 22/05/2026 | Chat personalization: sessions, messages, sources, exposure | chat persistence, learning exposure, tests |
| 23/05/2026 | Progress/signals, dashboard summary, personalization APIs | progress APIs, dashboard read model, tests |
| 24/05/2026 | Flashcards: deck, due review, SRS feedback | flashcard API/UI task, review flow, tests |
| 25/05/2026 | Assessment: start session, submit, result, progress signal | assessment flow, grading tests |
| 26/05/2026 | Planner: recommend, saved plans, complete item, personalized context | planner persistence, plan history, tests |
| 27/05/2026 | MVP hardening: frontend/demo flow, seed data, end-to-end smoke | smoke, bug fixes, final docs |

---

## Feedback Loop

Trong quá trình phát triển, dự án áp dụng **Feedback Loop** nghiêm ngặt để đảm bảo chất lượng phần mềm và tính chính xác của AI:

1. **Design & Brainstorm (Plan)**: 
   - Không vội vàng code. Luôn làm rõ requirement, input/output và luồng nghiệp vụ.
   - Xác nhận kiến trúc và cách tiếp cận trước khi tiến hành.
2. **Implementation (Code)**: 
   - Bám sát thiết kế đã chốt và tuân thủ các *Coding Standards* (SOLID, DDD, Clean Architecture).
3. **Verification (Test)**:
   - Viết và chạy unit tests, integration tests.
   - Đối với AI/RAG: Phải verify chất lượng retrieval (Neo4j, Qdrant) và response của LLM.
4. **Review & Iterate (Feedback)**:
   - Đánh giá kết quả so với yêu cầu ban đầu.
   - Nếu có lỗi hoặc chưa tối ưu, phân tích nguyên nhân và lặp lại vòng lặp từ bước 1 hoặc 2.
