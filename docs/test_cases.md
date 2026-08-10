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

## End-User Flow Checklist

These are the screen-by-screen checks for the current learner MVP. Run them with fresh storage, a normal registered account, and mobile viewports.

| Screen | Case | Steps | Expected Result |
|---|---|---|---|
| Landing | New learner starts from zero | Open landing, choose beginner/onboarding | The app goes to onboarding, not directly into guest study |
| Onboarding | Zero beginner | Answer 8 questions with current level = zero | Final step goes to register choice; copy explains create account or 3-lesson guest trial |
| Auth | Zero draft + existing login | Open `/login?mode=register&onboarding=1` with zero draft | Login tab is not offered; create-account mode is active; guest trial button is visible |
| Auth | Non-zero draft + login | Open auth with N5/N4 draft and choose login | Existing account keeps its current pathway; pending draft is not forced into that account |
| Guest Study | Optional guest trial | Click "Học thử 3 bài không đăng nhập" | Study opens without protected tools; progress is stored locally |
| Guest Study | Three-lesson limit | Pass the first 3 lesson quizzes | Lesson 4 stays locked and the primary CTA asks the learner to create an account |
| Guest Study | Reload after limit | Reload after 3 passed guest lessons | The learner remains at the registration gate, not back at lesson 1 |
| Register After Guest | Save progress | Create account from guest gate | Account receives the zero-beginner pathway and local first-3-lesson progress is migrated |
| Study | Normal lesson pass | Study flashcards, pass quiz at >=85% | Next lesson opens; feedback prompt appears for user-study data |
| Study | Normal lesson fail | Submit below 85% | Next lesson remains locked; review/Tutor repair path appears |
| Study | End of chapter | Pass all 3 lesson quizzes in one chapter | App requires a 20-question chapter test before opening the next chapter |
| Study | Chapter test fail | Submit chapter test below 85% | Next chapter remains locked; missed questions are shown; retry button appears |
| Study | Chapter test pass | Submit chapter test at >=85% | Next chapter opens; chapter progress is counted as complete |
| Assessment | Standalone chapter test | Open Assessment and choose a chapter card | A 20-question backend-graded session starts for that chapter level/category |
| Tutor | In-quiz support | Answer or focus a quiz question | Floating Tutor shows a contextual nudge for that exact question |
| Mobile | Auth/study/tour | Test 360x740, 390x844, 430x932, 768x1024 | Buttons do not overlap; active lesson appears before full pathway; tour highlights the next useful action |

## Full Regression Protocol

Do not mark a learner-flow change as done after testing only the changed button or one happy path. For any change in onboarding, auth, study, guest mode, assessment, flashcards, lookup, Tutor, feedback, responsive UI, or deployment, run the whole relevant suite and record the result.

Minimum for every frontend learner-flow change:

```powershell
cd frontend
npm run build
npm run test:e2e
```

This runs all current end-to-end specs:

| Spec | Coverage |
|---|---|
| `landing.spec.ts` | Landing page, public entry points, first action |
| `auth-mobile.spec.ts` | Mobile login/register layout and Google button usability |
| `auth-onboarding.spec.ts` | Pre-auth onboarding, existing login, register, Google mode, zero beginner guest option |
| `learner-mvp.spec.ts` | Dashboard, study, guest trial, chapter gate, assessment, flashcards, lookup, Tutor, feedback, pronunciation, tour, mobile study, refresh token |

Extra suites when the touched area needs them:

| Area Changed | Required Command |
|---|---|
| Backend API, auth, personalization, assessment, flashcards, planner | `cd backend; mvn test` |
| AI service, RAG, pronunciation, planner model code | `cd ai-service; python -m pytest` |
| RAG benchmark numbers for thesis appendix | `cd ai-service; python benchmark_rag.py --output ..\docs\rag_benchmark_results.csv --modes llm_only vector_only kg_only kg_vector` |

Manual smoke after production deploy:

| Flow | Must Check |
|---|---|
| Public site | Landing loads and API health returns `{"status":"ok","service":"backend"}` |
| Zero beginner | Onboarding does not auto-enter guest; auth shows create account and optional guest trial |
| Guest trial | Guest can study 3 lessons only; lesson 4 is locked; reload keeps the registration gate |
| Registered study | Pass quiz opens next lesson; fail quiz keeps learner in review; chapter test blocks next chapter until 85% |
| Mobile | 360x740, 390x844, 430x932, 768x1024 have no horizontal overflow and buttons do not overlap |

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
