# Test Cases For Thesis Feedback

This file lists the main test cases used to prove the system after teacher feedback. It is written for appendix use and maps directly to automated tests where possible.

| ID | Area | Teacher Feedback Covered | Test Case | Expected Result | Automated Test |
|---|---|---|---|---|---|
| TC-01 | Role-based AI workflow | Avoid overclaiming autonomous multi-agent system | Chat request must carry `contextTopic`, learner profile, and weak progress into the Tutor role | Tutor answer is tied to a learning context, not generic chat | `ChatServiceImplTest.chatPersistsSessionMessagesAndRecordsSourceExposure` |
| TC-02 | Grounded tutor/RAG | RAG reliability and source evidence | Tutor returns answer with sources, saves chat messages, and records source exposure only | Chat history has user/assistant messages; exposure count increases; mastery stays unchanged | `ApiIntegrationTest.chatRequiresJwtPersistsMessagesAndRecordsSourceExposureOnly` |
| TC-03 | Ungrounded AI safety | Avoid hallucination becoming learner progress | AI returns no sources | No exposure is recorded; confidence stays low | `ChatServiceImplTest.chatDoesNotRecordExposureWhenAiReturnsNoGroundingSources` |
| TC-04 | RAG benchmark RQ2 | Compare LLM only vs Vector vs KG vs KG+Vector | Benchmark question set has 50 questions, N5/N4 levels, and 4 retrieval modes | CSV can be generated for appendix; metric functions calculate Precision@3 and Recall | `test_rag_benchmark.py` |
| TC-05 | Personalized pathway | Personalization must vary by learner pathway | Run planner for JLPT, conversation, school, work, and reading profiles | First recommended task changes by pathway | `PlannerServiceImplTest.recommendChangesFirstTaskForEachLearnerPathway` |
| TC-06 | Personalized context | Planner must use real learner data | Profile, weak progress, due flashcards, recent chat, and latest assessment are available | Plan includes review, repair, assessment fix, pathway task, AI task, chat follow-up | `PlannerServiceImplTest.recommendCombinesAiPlanWithPersonalizationContext` |
| TC-07 | Adaptive study flow | Learner must pass before next lesson opens | Finish lesson flashcards and pass quiz with at least 85% | Next lesson is unlocked | `learner can start a lesson, review flashcards, pass the quiz, and unlock the next lesson` |
| TC-08 | Adaptive support flow | If learner fails, pathway slows down | Fail quiz below 85% | Next lesson stays locked; mistake review and Tutor explanation appear | `learner cannot unlock the next lesson below the pass score` |
| TC-09 | Pilot user study | Add small user test data collection | Submit in-lesson feedback after quiz result | `/personalization/me/feedback` receives rating, difficulty fit, pace, and action choice | `study pilot feedback captures user-test signal after a lesson result` |
| TC-10 | Feedback-based adaptation | Feedback must affect pathway only when it is an explicit support signal | Save hard/review feedback for a study lesson | Feedback is stored and creates a weak `StudyFeedback` progress signal; positive feedback does not create a weak signal | `PersonalizationServiceImplTest.recordStudyFeedbackCreatesExplicitWeakSignalWhenLearnerRequestsReview` |
| TC-11 | Learning signal contract | Mastery must use structured evidence only | Submit invalid source/result pair, such as ASSESSMENT + EASY | Backend rejects request and does not save progress | `PersonalizationServiceImplTest.recordLearningSignalRejectsInvalidSourceResultPair` |
| TC-12 | Flashcard learning | Quizlet-like review with SRS | Create deck, review by `cardId + rating` | Card schedule and mastery are updated; reviewed card is no longer due immediately | `ApiIntegrationTest.flashcardDeckLifecycleCreatesCardsTracksDueCardsAndReviewsByCardId` |
| TC-13 | Assessment integrity | Answer key must be backend-side | Start assessment then submit answers | Start response hides answer; submit grades from stored answer key and rejects resubmission | `ApiIntegrationTest.assessmentSessionStoresAnswerKeyAndUpdatesMasteryOnSubmit` |
| TC-14 | End-user usability | Learner should understand app without many buttons | New learner follows dashboard, study, flashcards, lookup, floating tutor | Main loop is visible and old separate roadmap/help menu does not appear | `learner can understand the MVP study loop` |
| TC-15 | Mobile usability | UI must work on small screens | Open study on mobile viewport | Active lesson appears before full pathway list | `mobile study view shows the active lesson before the full pathway` |
| TC-16 | Pilot metrics | Teacher requested completion time, score, SUS, trust, and pre/post data | Complete a lesson attempt, submit SUS survey, and run pre/post assessment | `/personalization/me/metrics` returns duration, pass rate, average score, SUS, trust, and score gain | `pilotStudyMetricsCaptureLessonSurveyAndAssessmentPairs`, `study metrics records lesson attempt and SUS survey after quiz` |

## Pilot User Test Plan

Target: 10-12 Vietnamese university students learning Japanese N5/N4.

Steps:

1. User completes onboarding.
2. User studies one personalized lesson.
3. User flips flashcards and completes quiz.
4. If score is below 85%, user reviews mistakes with VAJA Tutor.
5. User submits the short in-lesson feedback survey.
6. User submits the SUS/trust pilot survey after the lesson result.
7. Collect time-to-complete, quiz score, feedback rating, difficulty fit, trust/clarity for Tutor, SUS score, and comments.

Minimum reported metrics:

| Metric | Source |
|---|---|
| Time to complete one lesson | `/personalization/me/study-attempts` start/complete |
| Quiz score | `/personalization/me/study-attempts/{attemptId}/complete` |
| Pass/fail rate | `/personalization/me/metrics` or admin `/personalization/pilot-study/metrics` |
| Difficulty fit | `/personalization/me/feedback` |
| Tutor clarity and trust | Tutor feedback prompt |
| SUS score | `/personalization/me/pilot-surveys` and `/personalization/me/metrics` |
| Pre-test/Post-test gain | `/assessment/sessions` submitted before and after a study period |
| Main issue found by learner | Feedback/survey comment or interview note |

## RAG Benchmark Plan

Run the benchmark with:

```powershell
cd ai-service
$env:NEO4J_URI='bolt://localhost:7687'
$env:QDRANT_URL='http://localhost:6333'
$env:EMBEDDING_PROVIDER='local'
$env:EMBEDDING_VECTOR_SIZE='1024'
$env:LLM_PROVIDER='mock'
python benchmark_rag.py --output ..\docs\rag_benchmark_results.csv --modes llm_only vector_only kg_only kg_vector
```

Latest automated run: 08/08/2026, 50 questions x 4 modes = 200 rows.

| Mode | Avg Precision@3 | Source Recall | Runtime Errors |
|---|---:|---:|---:|
| LLM only | 0.000 | 0.000 | 0 |
| Vector only | 0.300 | 0.620 | 0 |
| KG only | 0.386 | 0.620 | 0 |
| KG + Vector | 0.386 | 0.740 | 0 |

Interpretation: KG gives better top-3 precision than vector search in the current dataset. KG + Vector keeps the same top-3 precision as KG and improves recall, so it is the best mode for finding at least one useful source.

Report:

| Metric | Meaning |
|---|---|
| Precision@3 | How many of the top 3 retrieved sources match expected terms |
| Source Recall | Whether at least one relevant source is retrieved |
| Faithfulness | Manual 0-2 score: answer follows retrieved sources |
| Correctness | Manual 0-2 score: answer is correct |
| Clarity | Manual 0-2 score: answer is easy for beginner |
