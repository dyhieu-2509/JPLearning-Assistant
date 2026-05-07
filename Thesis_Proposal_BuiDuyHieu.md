<div style="text-align: center; margin-top: 50px;">
  <h3>MINISTRY OF EDUCATION AND TRAINING</h3>
  <h3>FPT UNIVERSITY</h3>
  <br>
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo_2010.svg/256px-FPT_logo_2010.svg.png" width="150" alt="FPT Logo">
  <br><br>
  <h2>THESIS PROPOSAL</h2>
  <br>
  <p><strong>Major: Software Engineering</strong></p>
  <br><br><br>
  <h1>Design and Development of a Japanese Learning Virtual Assistant Web Application Using Multi-Agent Architecture and Knowledge Graph for Personalized Learning Paths of University Students in Vietnam</h1>
  <br><br><br>
</div>

<div style="margin-left: 20%; margin-top: 50px;">
  <p><strong>Supervisor:</strong> (Your Supervisor's Name)</p>
  <p><strong>Student:</strong> Bui Duy Hieu</p>
  <p><strong>Class:</strong> (Your Class)</p>
</div>

<div style="text-align: center; margin-top: 150px;">
  <p>Ho Chi Minh City, May 2026</p>
</div>

<div style="page-break-after: always;"></div>

## Contents
1. Introduction and Background
   1.1. Problem Description
   1.2. Research Objectives
   1.3. Scope of the Project
2. Proposed Solution
   2.1. Solution Description
   2.2. Software Architecture
   2.3. Technology Stack
3. Implementation Plan
   3.1. Main Development Stages
   3.2. Expected Schedule
   3.3. Feasibility Assessment
4. Expected Results
5. Evaluation Plan
6. References

<div style="page-break-after: always;"></div>

## 1. Introduction and Background

### 1.1. Problem Description
Learning Japanese in Vietnam, especially for university students, is currently facing significant challenges due to a lack of personalization. Most existing language learning applications (e.g., Duolingo, Memrise) offer a fixed, linear learning path and lack the ability for deep context-aware reasoning or flexible explanations. Furthermore, university students have highly diverse learning objectives, ranging from preparing for the Japanese Language Proficiency Test (JLPT N5-N2) for career purposes, practicing real-life communication, or simply studying to pass their university Japanese courses. The absence of a system capable of automatically assessing current proficiency, understanding specific goals, and dynamically generating a personalized learning path leads to a waste of time and reduces students' motivation.

### 1.2. Research Objectives
This project aims to research and develop an intelligent virtual assistant system (Web Application) to address these limitations. The specific objectives are:
1. To construct a **Knowledge Graph** linking learning entities (Vocabulary, Kanji, Grammar, Example Sentences) based on standard textbooks (Minna no Nihongo, Soumatome, Marugoto) and customized university syllabus data.
2. To design and integrate a **Multi-Agent Architecture** to simulate the roles of a personal tutor and planner, covering tasks from initial placement tests to schedule generation and interactive Q&A.
3. To propose and implement an **Automated Curriculum Generation** algorithm based on the user's current proficiency, specific learning goals, and daily available study time.

### 1.3. Scope of the Project
* **Target Audience:** University students in Vietnam.
* **Language Scope:** The user interface and grammar/vocabulary explanations will be entirely in Vietnamese to ensure comprehension.
* **Data Scope:** Japanese grammar, vocabulary, and Kanji from beginner (N5) to intermediate-advanced levels (N2).
* **Business Scope:** The system focuses on acting as a Planner (scheduling) and a Tutor (explaining queries via RAG). It is designed to be highly flexible and student-centric, aiming to reduce the strict, rigid pedagogical pressures often found in traditional teaching environments.

## 2. Proposed Solution

### 2.1. Solution Description
The proposed solution is a Web Application leveraging Multi-Agent architecture combined with Agentic RAG and Knowledge Graphs. The user workflow includes:
1. **Onboarding & Placement Test:** The system dynamically generates a test from the Graph DB using an adaptive algorithm to evaluate the student's proficiency level.
2. **Goal Setting:** The student selects a specific objective (e.g., JLPT N3, Communication, or Passing a university module) and their daily time commitment.
3. **Automated Curriculum Generation:** The Planner Agent queries the Graph DB and calculates the required knowledge load to create a detailed daily roadmap (timeline/calendar format).
4. **Interactive Daily Learning:** The Tutor Agent tracks progress, provides daily flashcards/quizzes, and uses RAG to answer contextual grammar queries in Vietnamese based on the textbook database.

### 2.2. Software Architecture
The system adopts a Service-Oriented Architecture (SOA) integrated with a Multi-Agent Framework:
* **Knowledge Base (Graph DB):** An Ontology organizing lessons, vocabulary, and grammar into a network structure (Neo4j).
* **Agentic Framework:**
  * *Assessor Agent:* Responsible for generating test questions and evaluating proficiency.
  * *Planner Agent:* Calculates the shortest path (pathfinding) within the Knowledge Graph to formulate the study curriculum.
  * *Tutor Agent:* Utilizes Retrieval-Augmented Generation (RAG) to fetch documentation and explain grammar structures.
* **Backend API:** Manages User Data, Progress Tracking, and the Spaced Repetition System (SRS).

### 2.3. Technology Stack
* **Backend:** Python (FastAPI) for high performance and asynchronous support.
* **Frontend:** ReactJS / Next.js for an interactive and modern user experience.
* **Database:** PostgreSQL (Relational Data), Neo4j (Graph DB for Knowledge Graph), Milvus/Qdrant (Vector DB for RAG).
* **AI & LLM Integration:** LangChain / AutoGen Framework powered by OpenAI or Gemini LLMs.
* **Data Pipeline:** Python scripts leveraging BeautifulSoup, Pandas, and PyPDF2 to crawl, parse, and clean data from Anki Decks, PDFs, and web sources.

## 3. Implementation Plan

### 3.1. Main Development Stages
* **Phase 1: Data & KG Foundation:** Crawl and parse JLPT N5-N1 and Minna no Nihongo datasets into CSV/JSON formats. Construct the ontology and import data into Neo4j.
* **Phase 2: Core Backend & Placement Test Engine:** Develop the FastAPI backend, set up PostgreSQL, and build the placement test algorithm.
* **Phase 3: Curriculum Engine (Multi-Agent):** Develop the Planner Agent and the automated roadmap generation algorithm based on the Knowledge Graph.
* **Phase 4: Frontend Development:** Design and build the interactive Web Dashboard, Test Interfaces, and Chat UI.
* **Phase 5: Tutor Agent & Deployment:** Implement the RAG-based Tutor Agent, conduct rigorous testing, fix bugs, and deploy the application.

### 3.2. Expected Schedule
* **Month 1:** System Design and Knowledge Graph Data Pipeline construction.
* **Month 2:** FastAPI Backend development and Curriculum/Placement Test Engine implementation.
* **Month 3:** Frontend UI/UX development and API integration.
* **Month 4:** Multi-Agent RAG integration, Testing, and Final Review.

### 3.3. Feasibility Assessment
* **Data Feasibility:** The core datasets (Vocabulary, Grammar, Sentence pairs in Vietnamese) have already been successfully crawled and structured.
* **Technical Feasibility:** The combination of Python/FastAPI, LangChain, and Neo4j consists of mature, well-documented technologies that strongly support AI and Graph-based operations.

## 4. Expected Results
* A fully functional, responsive Web Application tailored for Vietnamese students.
* A standardized Knowledge Graph accurately linking Japanese linguistic concepts across multiple textbook formats.
* A Multi-Agent system capable of automating proficiency assessments, personalizing daily learning paths, and providing 24/7 contextual tutoring.
* Demonstrated improvement in student motivation and learning efficiency compared to traditional linear applications.

## 5. Evaluation Plan
1. **Technical Evaluation:**
   * Measure the response time of the Curriculum Generation algorithm (target: under 5 seconds).
   * Evaluate the accuracy and relevance metrics of the RAG system when explaining Japanese grammar.
2. **User Evaluation:**
   * Conduct Beta testing with a targeted group of university students.
   * Collect Customer Satisfaction (CSAT) scores and qualitative feedback regarding the usefulness of the personalized learning paths versus traditional study methods.

## 6. References
1. Duong Van Thieu, *Design and Development of a Tour Concierge Agent for Travel Agencies Using a Multi-Agent and Agentic RAG Framework*, Master Thesis Proposal, FPT University, 2026.
2. Additional literature on Multi-Agent Systems, RAG, and Graph Databases in Education to be added.
