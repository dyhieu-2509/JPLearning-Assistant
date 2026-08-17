# VAJA Thesis Defense Speaker Notes - English

## Slide 01 - Cover

I will present VAJA, a personalized Japanese learning assistant for N5/N4 learners. The main focus is software design, KG-RAG, personalized pathways, flashcards, quizzes, and initial evaluation.

## Slide 02 - Problem

The main problem is that beginner learners often do not know what to study next. General chatbots can answer many questions, but they may not give clear sources. Quiz and flashcards are also often separated from the learner's real progress.

## Slide 03 - Agenda

This is the agenda slide. The defense follows six parts: the learning problem, the scope of the agent architecture, system architecture, personalization, evaluation, and demo. The goal is not to promote an app, but to show the design, implementation, and evaluation of the system.

## Slide 04 - Research Questions

The thesis has four research questions. They focus on system architecture, whether KG plus Vector RAG improves retrieval, how the pathway is personalized, and whether learners can use the system in a small pilot test.

## Slide 05 - Terminology

To avoid overclaiming, agent in this thesis means a role-based agent architecture. Tutor, Pathway, Assessment, and Review are specialized roles. This is not a fully autonomous multi-agent system with complex negotiation.

## Slide 06 - Architecture

The system has three main parts: React frontend, Spring Boot backend, and Python FastAPI AI service. Spring Boot handles business logic, security, APIs, and learner data. FastAPI handles AI-related tasks such as RAG, Tutor, and planning support. Data is stored in PostgreSQL, Neo4j, and Qdrant.

## Slide 07 - Learner Flow

The learner follows a clear flow: onboarding, pathway, flashcards, lesson quiz, chapter test, and feedback. A learner needs 85% to unlock the next lesson. After three lessons, the learner needs to pass a 20-question chapter test.

## Slide 08 - Personalization

Personalization is based on level, learning goal, daily study time, weak skills, quiz results, flashcard review, fail count, and feedback. A zero beginner studies kana first. A learner who fails many times gets more review. A learner who does well can move faster.

## Slide 09 - Tutor + RAG

The Tutor is not only free chat. It receives the lesson context, retrieves sources from Knowledge Graph and Vector DB, then generates an answer. Chat only records exposure. Mastery changes only when there is a structured signal from quiz, assessment, or flashcard review.

## Slide 10 - Assessment + Mastery

Quiz and assessment are important because they create clear learning signals. The answer key is stored in the backend. The frontend does not receive answers when a session starts. After submission, the backend grades the answers and records correct or wrong results.

## Slide 11 - Software Engineering

Because this is an MSE thesis, the main contribution is also software engineering. The system has clean architecture, clear API contracts, JWT and refresh token, Docker setup, benchmark scripts, automated tests, and public deployment.

## Slide 12 - RAG Benchmark

The benchmark uses 50 N5/N4 questions and four modes. KG plus Vector has the highest Source Recall at 0.740. This supports RQ2, because combining graph and vector retrieval gives better source coverage.

## Slide 13 - Pilot User Test

The pilot has 10 survey users, 11 feedback users, and 25 lesson attempts. The SUS score is 58.6, trust is 3.45 out of 5, average lesson score is 82.4%, and pass rate is 56%. The result shows that the flow can be completed, but usability still needs improvement.

## Slide 14 - Feedback Improvements

Based on user feedback, the system was improved with a kana overview, tour guide, chapter pathway, chapter test, audio, pronunciation scoring MVP, and a floating Tutor during study.

## Slide 15 - Demo Scenario

The demo will focus on a zero-beginner learner. The learner opens the landing page, answers onboarding questions, studies kana, uses flashcards and audio, completes a quiz, sees the chapter gate, and can ask VAJA when needed.

## Slide 16 - Conclusion

VAJA works end-to-end, uses KG-RAG, supports a personalized pathway at prototype level, and has benchmark and pilot data. The limitations are small pilot size, weak pre/post-test data, heuristic pathway logic, and the need for stronger BKT/IRT or long-term learning data.
