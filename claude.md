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
| `spring-boot-starter-validation` | Request validation |
| `springdoc-openapi` | Swagger/OpenAPI docs |
| `lombok` | Reduce boilerplate |
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

### Cấu trúc Spring Boot

```
backend/
├── src/main/java/com/jpassistant/
│   ├── JpAssistantApplication.java
│   ├── config/                        # Security, WebClient, Neo4j config
│   ├── domain/                        # Entities, Value Objects
│   │   ├── user/
│   │   │   ├── User.java              # Entity
│   │   │   ├── UserRepository.java    # Interface (Spring Data)
│   │   │   └── LearningGoal.java      # Value Object
│   │   ├── knowledge/
│   │   │   ├── Vocabulary.java
│   │   │   ├── GrammarPoint.java
│   │   │   ├── Kanji.java
│   │   │   └── KnowledgeGraphRepository.java
│   │   └── progress/
│   │       ├── LearningProgress.java
│   │       └── QuizResult.java
│   ├── application/                   # Service interfaces + impls
│   │   ├── service/
│   │   │   ├── UserService.java       # Interface
│   │   │   ├── UserServiceImpl.java   # Business logic
│   │   │   ├── KnowledgeService.java
│   │   │   ├── KnowledgeServiceImpl.java
│   │   │   └── AiServiceClient.java   # Calls Python AI Service
│   │   ├── dto/
│   │   │   ├── UserDTO.java
│   │   │   ├── ChatRequestDTO.java
│   │   │   └── AssessmentDTO.java
│   │   └── mapper/
│   │       └── UserMapper.java        # MapStruct
│   ├── infrastructure/                # External adapters
│   │   ├── persistence/
│   │   │   ├── JpaUserRepository.java
│   │   │   └── Neo4jKnowledgeRepository.java
│   │   └── external/
│   │       └── AiServiceClientImpl.java  # WebClient → Python
│   └── api/                           # Controllers (thin!)
│       └── v1/
│           ├── AuthController.java
│           ├── UserController.java
│           ├── ChatController.java
│           ├── KnowledgeController.java
│           └── AssessmentController.java
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

1. **Mọi thay đổi phải có test** — unit test cho service, integration test cho API.
2. **Type safety** — Java: no raw types. Python: type hints bắt buộc.
3. **Docstrings/Javadoc** — tất cả public methods.
4. **Error handling** — custom exceptions, xử lý tập trung (`@ControllerAdvice` / `error_handlers.py`).
5. **Environment variables** — không hardcode secrets. Dùng `application.yml` + `.env`.
6. **DB migrations** — Flyway (Java), Alembic (Python nếu cần).
7. **Git commits** — conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`).
8. **API versioning** — tất cả endpoints bắt đầu bằng `/api/v1/`.

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
