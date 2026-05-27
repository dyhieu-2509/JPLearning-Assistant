<div style="text-align: center; margin-top: 40px;">
  <h3>MINISTRY OF EDUCATION AND TRAINING</h3>
  <h3>FPT SCHOOL OF BUSINESS & TECHNOLOGY</h3>
  <br>
  <h2>MASTER THESIS PROPOSAL</h2>
  <p><strong>Major: Software Engineering</strong></p>
  <br>
  <h1>Design and Implementation of a Web-Based Virtual Assistant for Japanese Language Learning Leveraging Multi-Agent Systems and Knowledge Graphs to Personalize Learning Pathways for Vietnamese University Students</h1>
  <br>
</div>

<div style="margin-left: 18%; margin-top: 45px;">
  <p><strong>Supervisor:</strong> Dr. Nguyen Duy Nghiem</p>
  <p><strong>Student:</strong> Bui Duy Hieu</p>
  <p><strong>Class:</strong> MSE26HCM</p>
</div>

<div style="text-align: center; margin-top: 120px;">
  <p>Ho Chi Minh City, May 2026</p>
</div>

<div style="page-break-after: always;"></div>

## Contents

1. Introduction and Background  
   1.1. Problem Description  
   1.2. Research Objectives  
   1.3. Research Questions  
   1.4. Scope of the Project  
2. Proposed Solution  
   2.1. Solution Description  
   2.2. Software Architecture  
   2.3. Knowledge Graph Design  
   2.4. Technology Stack  
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

In recent years, the relationship between Vietnam and Japan has continued to grow in education, business, technology, and labor cooperation. As a result, many Vietnamese university students are interested in learning Japanese to improve their academic opportunities, prepare for international work environments, and increase their competitiveness in the labor market.

However, Japanese remains a difficult language for Vietnamese learners because it requires learners to master multiple writing systems, sentence structures, honorific expressions, particles, and context-dependent usage. Beginner students often struggle to connect vocabulary, grammar, kanji, and example sentences into a coherent learning path. As a result, many learners memorize language items separately but cannot apply them effectively in reading, listening, or communication.

Current learning approaches still have several limitations. Traditional classroom learning provides guidance from teachers but cannot always adapt to the pace, goals, and weaknesses of each student. Mobile applications and online courses are convenient, but they commonly provide fixed lesson sequences, repeated drills, and generic explanations. Students who want to prepare for the JLPT, review university course content, or focus on practical communication often receive similar learning paths even though their needs are different.

Large Language Models (LLMs) such as ChatGPT have shown strong potential for interactive education because they can answer questions, explain concepts, and generate examples. Nevertheless, general-purpose chatbots may produce inaccurate or inconsistent answers, especially when the topic requires structured knowledge and reliable references. They also do not naturally maintain a personalized roadmap, track prerequisite knowledge, or explain why a learner should study one topic before another.

Therefore, there is a need for a Japanese learning support system that combines conversational AI with structured learning knowledge. This thesis proposes a web-based virtual assistant that uses a Knowledge Graph and a simple multi-agent architecture to support personalized Japanese learning for Vietnamese university students. The system is designed to organize learning content, retrieve relevant knowledge before answering questions, and recommend suitable study paths based on learner profiles and goals.

### 1.2. Research Objectives

The main objective of this study is to design and develop an AI-based Japanese learning assistant that supports personalized learning for Vietnamese university students at the beginner level.

The specific objectives are:

1. To build a Knowledge Graph containing Japanese learning materials such as vocabulary, grammar points, kanji, lessons, and example sentences for JLPT N5 level.
2. To develop a virtual assistant capable of answering Japanese learning questions in Vietnamese using Retrieval-Augmented Generation (RAG).
3. To design a simple multi-agent workflow that separates system responsibilities into tutoring, planning, and assessment modules.
4. To generate personalized study recommendations based on learner level, learning goals, available study time, and progress.
5. To evaluate the system in terms of response quality, retrieval relevance, system performance, and user usefulness.

### 1.3. Research Questions

This thesis aims to answer the following research questions:

1. How can Japanese learning materials be represented as a Knowledge Graph to support structured retrieval and prerequisite-based learning?
2. How can RAG improve the reliability of LLM-generated Japanese grammar and vocabulary explanations for Vietnamese learners?
3. How can a multi-agent workflow divide responsibilities between tutoring, planning, and assessment in a learning assistant system?
4. How effective is the proposed system compared with a baseline chatbot that does not use Knowledge Graph retrieval?

### 1.4. Scope of the Project

This project focuses on Vietnamese university students who are learning Japanese at beginner level. The scope includes:

- Supporting Japanese learning for JLPT N5 level.
- Providing grammar explanations, vocabulary support, kanji information, and simple example sentences.
- Using Vietnamese as the primary explanation language for learners.
- Generating study recommendations based on user goals and progress.
- Developing a web-based prototype for academic demonstration and evaluation.

The project does not include:

- Speech recognition or pronunciation scoring.
- Handwriting recognition for kanji.
- Full commercial deployment.
- Complete coverage of higher JLPT levels such as N4, N3, N2, or N1.
- Advanced gamification, payment, or social learning features.

The research mainly concentrates on backend system design, AI integration, knowledge organization, and personalized learning recommendation rather than complex frontend design.

## 2. Proposed Solution

### 2.1. Solution Description

The proposed system is a web-based virtual assistant for Japanese language learning. It combines Large Language Models, Retrieval-Augmented Generation, and a Knowledge Graph to provide structured and personalized learning support.

The main workflow is as follows:

1. The learner creates a profile and selects a learning goal, such as JLPT N5 preparation or review of beginner Japanese grammar.
2. The system performs a simple placement assessment to estimate the learner's current level.
3. The planner module uses the learner profile and Knowledge Graph relationships to recommend a learning roadmap.
4. During study sessions, the tutor module answers questions about grammar, vocabulary, kanji, and example sentences.
5. Before generating an answer, the assistant retrieves related learning content from the Knowledge Graph and vector database to improve answer accuracy.
6. The assessment module provides short quizzes and updates learner progress.

Compared with a traditional chatbot, the proposed system is not limited to open-ended conversation. It is designed to connect answers with structured learning materials, track learner progress, and recommend what to study next.

### 2.2. Software Architecture

The system adopts a modular architecture consisting of six main components:

1. **Web User Interface**  
   The user interface allows learners to sign in, set goals, view recommendations, take quizzes, and chat with the virtual assistant.

2. **Backend API**  
   The backend provides REST APIs for authentication, learner profiles, progress tracking, quiz management, chat requests, and roadmap generation.

3. **Knowledge Graph**  
   The Knowledge Graph stores Japanese learning concepts and their relationships, including lessons, vocabulary, grammar points, kanji, examples, and prerequisite links.

4. **Tutor Agent**  
   The Tutor Agent answers learner questions by retrieving relevant content and generating Vietnamese explanations. It focuses on clarity, correctness, and beginner-friendly examples.

5. **Planner Agent**  
   The Planner Agent recommends learning paths based on the learner's goal, current level, available study time, and prerequisite relationships in the Knowledge Graph.

6. **Assessment Agent**  
   The Assessment Agent generates short quizzes, checks answers, estimates learner mastery, and updates progress records.

The following diagram summarizes the proposed data flow:

```text
Learner
   |
   v
Web User Interface
   |
   v
Backend API
   |
   +--> Tutor Agent -------> RAG Retrieval -------> Vector Database
   |        |                                      |
   |        +--------------------------------------+
   |                         |
   |                         v
   |                  Knowledge Graph
   |
   +--> Planner Agent -----> Learning Roadmap
   |
   +--> Assessment Agent --> Quizzes and Progress
   |
   v
PostgreSQL User Data
```

### 2.3. Knowledge Graph Design

The Knowledge Graph is the central knowledge organization layer of the proposed system. It represents Japanese learning materials as connected entities instead of isolated documents.

The main node types include:

| Node Type | Description |
| --- | --- |
| `Lesson` | A unit of learning content, such as a textbook lesson or JLPT topic group. |
| `Vocabulary` | Japanese words with reading, meaning, part of speech, and example usage. |
| `GrammarPoint` | Grammar patterns with structure, meaning, explanation, and examples. |
| `Kanji` | Kanji characters with onyomi, kunyomi, meaning, and related vocabulary. |
| `ExampleSentence` | Sentences that demonstrate vocabulary or grammar usage. |
| `QuizQuestion` | Questions used for assessment and practice. |

The main relationship types include:

| Relationship | Description |
| --- | --- |
| `CONTAINS` | A lesson contains vocabulary, grammar, kanji, or examples. |
| `USES_GRAMMAR` | An example sentence uses a specific grammar point. |
| `USES_VOCABULARY` | An example sentence uses specific vocabulary. |
| `USES_KANJI` | A vocabulary item uses one or more kanji. |
| `PREREQUISITE_OF` | One learning item should be studied before another. |
| `RELATED_TO` | Two learning items are semantically or pedagogically related. |

This structure allows the system to answer questions with context, recommend prerequisite topics, and generate a learning path that is more explainable than a fixed linear sequence.

### 2.4. Technology Stack

The project uses modern, open-source technologies that are suitable for rapid prototype development.

| Category | Technology | Purpose |
| --- | --- | --- |
| Backend | Python, FastAPI | REST API development and AI service orchestration |
| Frontend | Streamlit or Gradio | Simple web interface for prototype demonstration |
| Relational Database | PostgreSQL | Store users, learning goals, progress, and quiz results |
| Graph Database | Neo4j | Store relationships between Japanese learning concepts |
| Vector Database | Qdrant | Store embeddings for semantic search and RAG retrieval |
| AI Framework | LangChain or LangGraph | Implement RAG workflow and agent orchestration |
| LLM Provider | OpenAI API or Gemini API | Generate explanations and conversational responses |
| Development Tools | Git, Docker, Postman | Version control, environment setup, and API testing |

## 3. Implementation Plan

### 3.1. Main Development Stages

The project will be implemented in the following stages:

**Stage 1: Requirement Analysis and Data Collection**  
Study existing Japanese learning applications, review related research, define user requirements, and collect JLPT N5 learning materials including vocabulary, grammar, kanji, and example sentences.

**Stage 2: Data Cleaning and Knowledge Graph Construction**  
Clean collected datasets, define graph schema, create relationships between learning concepts, and import the structured data into Neo4j.

**Stage 3: Backend Development**  
Develop REST APIs using FastAPI, connect PostgreSQL and Neo4j, implement learner profile management, progress tracking, and quiz-related functions.

**Stage 4: AI Integration**  
Integrate LLM services, implement RAG retrieval, build Tutor Agent functions, and connect answers with Knowledge Graph context.

**Stage 5: Planner and Assessment Modules**  
Develop learning roadmap generation, prerequisite-based recommendation logic, quiz generation, answer checking, and mastery tracking.

**Stage 6: Testing and Evaluation**  
Evaluate chatbot response quality, retrieval accuracy, API response time, graph query performance, and overall usefulness with test users if available.

**Stage 7: Final Report and Presentation**  
Summarize research findings, implementation results, limitations, and future improvements. Complete the final thesis report and presentation materials.

### 3.2. Expected Schedule

| Week | Activities |
| --- | --- |
| Week 1-2 | Requirement analysis, literature review, and dataset collection |
| Week 3-4 | Data cleaning, Knowledge Graph schema design, and Neo4j setup |
| Week 5-6 | Backend API development and database integration |
| Week 7-8 | RAG implementation and Tutor Agent integration |
| Week 9 | Planner Agent and Assessment Agent implementation |
| Week 10 | System integration and functional testing |
| Week 11 | Evaluation, user testing, and result analysis |
| Week 12 | Final report, documentation, and presentation preparation |

### 3.3. Feasibility Assessment

This project is feasible because the research scope is limited to beginner-level Japanese learning and focuses on a working academic prototype rather than a complete commercial product.

From a data perspective, JLPT N5 learning materials are widely available from textbooks, open educational resources, and structured datasets. The project can focus on cleaned and curated data instead of attempting to cover all Japanese levels.

From a technical perspective, the selected technologies are mature and well documented. FastAPI supports rapid backend development, Neo4j is suitable for graph-based learning relationships, Qdrant supports semantic retrieval, and LangChain or LangGraph can help organize RAG and agent workflows.

However, several challenges may occur. The first challenge is the quality of AI-generated responses. LLMs may produce inaccurate explanations if they are not grounded in reliable learning materials. This risk will be reduced by using RAG and Knowledge Graph retrieval before answer generation.

The second challenge is time limitation. Because the project timeline is short, the prototype will prioritize core features such as knowledge retrieval, Vietnamese explanations, quiz support, and personalized recommendations. Advanced functions such as speech recognition, mobile deployment, and higher JLPT levels will be considered future work.

## 4. Expected Results

The project is expected to produce the following outcomes:

1. A web-based Japanese learning assistant prototype for Vietnamese university students.
2. A structured Knowledge Graph for JLPT N5 learning content, including vocabulary, grammar, kanji, lessons, and example sentences.
3. A RAG-based tutoring module capable of answering Japanese learning questions in Vietnamese.
4. A simple multi-agent workflow that separates tutoring, planning, and assessment responsibilities.
5. A personalized learning recommendation feature based on learner goals, current level, available study time, and progress.
6. A backend system that stores learner profiles, study progress, chat history, quiz results, and learning roadmap data.
7. An evaluation report analyzing response quality, retrieval relevance, system performance, and user feedback.

The expected academic contribution is a practical demonstration of how Knowledge Graphs and LLM-based agents can be combined to support personalized language learning. The system is also expected to show that structured retrieval can improve the reliability of AI-generated explanations compared with a general chatbot.

## 5. Evaluation Plan

The proposed system will be evaluated using technical testing, response quality assessment, and user feedback.

### 5.1. Response Accuracy

The generated explanations will be compared with reference materials to determine whether the answers are correct, complete, and suitable for beginner learners. A small set of representative grammar, vocabulary, and kanji questions will be prepared for testing.

The evaluation criteria include:

- Correctness of grammar explanations.
- Accuracy of Vietnamese meanings.
- Relevance of example sentences.
- Clarity for beginner learners.
- Consistency across repeated questions.

### 5.2. Retrieval Quality

Retrieval quality will be evaluated by checking whether the system retrieves the correct grammar points, vocabulary items, kanji, or example sentences before answer generation.

The planned metrics include:

- Top-k retrieval accuracy.
- Relevance score judged by manual review.
- Number of answers supported by retrieved evidence.
- Cases where retrieval returns missing or unrelated content.

### 5.3. System Performance

Performance testing will measure whether the system can respond within an acceptable time for interactive learning.

The planned measurements include:

- API response time.
- Vector retrieval latency.
- Neo4j query latency.
- End-to-end chatbot response time.
- Stability during repeated usage.

### 5.4. Personalization Quality

The learning roadmap generated by the Planner Agent will be evaluated to determine whether it matches the learner's goal and current level.

The evaluation criteria include:

- Whether recommended topics follow prerequisite relationships.
- Whether the workload is appropriate for the available study time.
- Whether completed topics are excluded or reduced in future recommendations.
- Whether weak topics are prioritized for review.

### 5.5. Baseline Comparison

The proposed system will be compared with a baseline chatbot that uses only an LLM prompt without Knowledge Graph retrieval. Both systems will answer the same set of Japanese learning questions.

The comparison will focus on:

- Accuracy of explanations.
- Number of unsupported or hallucinated statements.
- Relevance of examples.
- Consistency of answers.
- Usefulness for beginner learners.

### 5.6. User Feedback

If possible, several Vietnamese university students will be invited to test the prototype. Their feedback will be collected through a short questionnaire and informal interview.

The feedback criteria include:

- Ease of use.
- Clarity of explanations.
- Usefulness of recommended learning paths.
- Trust in the assistant's answers.
- Overall learning experience.

## 6. References

[1] S. Pan, L. Luo, Y. Wang, C. Chen, J. Wang, and X. Wu, "Unifying Large Language Models and Knowledge Graphs: A Roadmap," *IEEE Transactions on Knowledge and Data Engineering*, vol. 36, no. 7, pp. 3580-3599, 2024.

[2] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," *Advances in Neural Information Processing Systems*, vol. 33, pp. 9459-9474, 2020.

[3] LangChain, "LangGraph Documentation," LangChain Documentation. Accessed: May 25, 2026. [Online]. Available: https://langchain-ai.github.io/langgraph/

[4] Neo4j, "Neo4j Documentation." Accessed: May 25, 2026. [Online]. Available: https://neo4j.com/docs/

[5] Qdrant, "Qdrant Documentation." Accessed: May 25, 2026. [Online]. Available: https://qdrant.tech/documentation/

[6] The Japan Foundation and Japan Educational Exchanges and Services, "Japanese-Language Proficiency Test Official Practice Workbook," JLPT Official Materials. [Online]. Available: https://www.jlpt.jp/e/samples/sampleindex.html

[7] 3A Corporation, *Minna no Nihongo Shokyu I*, 2nd ed. Tokyo: 3A Network, 2012.

[8] 3A Corporation, *Minna no Nihongo Shokyu II*, 2nd ed. Tokyo: 3A Network, 2012.
