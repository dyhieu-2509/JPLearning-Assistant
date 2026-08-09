# Pilot Study Data Snapshot

Generated on: 2026-08-09

This file summarizes the current pilot-study data for appendix use. It excludes QA seed accounts, local test accounts, and demo accounts. Participant rows are anonymized as P01, P02, and so on.

## 1. Data Scope

| Item | Value |
|---|---:|
| Real survey users | 10 |
| Survey rows | 11 |
| Real feedback users | 11 |
| Feedback rows | 18 |
| Users with completed lessons | 10 |
| Completed lesson attempts | 25 |
| Users with submitted assessments | 2 |
| Submitted assessments | 3 |
| Knowledge progress users | 19 |
| Knowledge progress rows | 185 |

Note: one participant submitted two survey rows. The current pilot data now meets the lower bound of the planned 10-12 user test for survey count, but the pre-test/post-test sample is still weak.

## 2. Main Pilot Metrics

| Metric | Value |
|---|---:|
| Average SUS score | 58.6 |
| Average trust rating | 3.45 / 5 |
| Average lesson score | 82.4% |
| Pass rate | 56.0% |
| Average completion time | 0.60 minutes |
| Passed lesson attempts | 14 |
| Failed lesson attempts | 11 |

Interpretation: the score shows that learners can finish the study flow, but usability is still only moderate. Several users said the first learning flow was confusing, the UI had too much text, and audio/pronunciation support should be clearer.

## 3. Participant Summary

| Participant | Surveys | Feedbacks | Completed Lessons | Avg Lesson Score | Pass Rate | Avg Time (min) | SUS | Trust | Assessments |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| P01 | 1 | 2 | 3 | 80.0% | 33.3% | 0.36 | 45.0 | 2.0 | 0 |
| P02 | 1 | 2 | 3 | 100.0% | 100.0% | 0.35 | 60.0 | 2.0 | 0 |
| P03 | 1 | 0 | 1 | 100.0% | 100.0% | 0.60 | 85.0 | 5.0 | 0 |
| P04 | 1 | 0 | 1 | 40.0% | 0.0% | 1.34 | 92.5 | 5.0 | 0 |
| P05 | 2 | 0 | 3 | 53.3% | 33.3% | 1.03 | 47.5 | 3.0 | 0 |
| P06 | 1 | 5 | 8 | 77.5% | 25.0% | 0.48 | 65.0 | 5.0 | 0 |
| P07 | 1 | 1 | 1 | 100.0% | 100.0% | 0.70 | 50.0 | 2.0 | 0 |
| P08 | 1 | 1 | 2 | 100.0% | 100.0% | 1.19 | 52.5 | 4.0 | 0 |
| P09 | 1 | 1 | 2 | 100.0% | 100.0% | 0.30 | 50.0 | 2.0 | 2 |
| P10 | 1 | 1 | 1 | 100.0% | 100.0% | 0.18 | 50.0 | 5.0 | 0 |

## 4. Feedback Counts

| Difficulty fit | Count |
|---|---:|
| Too easy | 7 |
| Just right | 6 |
| Too hard | 4 |

| Learner action choice | Count |
|---|---:|
| Move on | 13 |
| Review again | 5 |

| Pace choice | Count |
|---|---:|
| Fast | 11 |
| Steady | 3 |
| Support | 3 |

## 5. Main User Comments

The comments show five repeated issues:

1. Some new users did not understand how to use the app at first.
2. Some quiz questions and task wording were not clear enough.
3. The UI had too much text and needed more visual support.
4. Audio and pronunciation support were important for communication learning.
5. The chatbot was not always needed in the first lesson, but may help more in later lessons.

These comments already led to product changes: kana overview, clearer lesson guidance, flashcard pronunciation audio, pronunciation scoring MVP, immediate quiz explanation, and a floating tutor.

## 6. Pre-test/Post-test Status

The current pre-test/post-test data is not strong enough yet.

| Item | Value |
|---|---:|
| Users with submitted assessments | 2 |
| Assessment users with at least two submitted tests | 1 |
| Current average assessment gain | 0.0% |

For the thesis, this should be reported carefully as a limitation. To improve this part, collect at least 3-5 more users with this flow: pre-test, one study session, post-test.

## 7. RAG Benchmark Result

The RAG benchmark has stronger evidence and is ready for appendix use.

| Mode | Rows | Avg Precision@3 | Source Recall | Runtime Errors |
|---|---:|---:|---:|---:|
| LLM only | 50 | 0.000 | 0.000 | 0 |
| Vector only | 50 | 0.300 | 0.620 | 0 |
| KG only | 50 | 0.386 | 0.620 | 0 |
| KG + Vector | 50 | 0.386 | 0.740 | 0 |

Interpretation: KG + Vector gives the best source recall while keeping the same Precision@3 as KG only. This supports the RQ2 claim that graph and vector retrieval together can give better source coverage than one retrieval method alone.

## 8. Thesis Use

Recommended wording:

"A small pilot test was conducted with 10 Vietnamese learners. The system collected lesson attempt time, quiz score, pass/fail result, short in-app feedback, SUS score, trust rating, and open comments. The result shows that the core study flow can be completed, but usability still needs improvement. The pre-test/post-test sample is still small, so learning gain is reported as a limitation rather than a final conclusion."

