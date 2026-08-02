import csv

from app.domain.schemas import KnowledgeSource
from benchmark_rag import BENCHMARK_QUESTIONS, MODES, merge_sources, source_metrics, write_question_set


def test_rag_benchmark_question_set_matches_rq2_design() -> None:
    levels = {question.level for question in BENCHMARK_QUESTIONS}
    categories = {question.category for question in BENCHMARK_QUESTIONS}

    assert len(BENCHMARK_QUESTIONS) == 50
    assert set(MODES) == {"llm_only", "vector_only", "kg_only", "kg_vector"}
    assert levels == {"N5", "N4"}
    assert {"grammar", "vocabulary", "kanji", "particle"}.issubset(categories)
    assert all(question.expected_terms for question in BENCHMARK_QUESTIONS)


def test_rag_benchmark_metrics_use_top_three_precision_and_source_recall() -> None:
    sources = [
        KnowledgeSource(type="GrammarPoint", id="particle-wa:N5", title="\u306f", meaningVi="chu de"),
        KnowledgeSource(type="Vocabulary", id="noise-1", title="noise"),
        KnowledgeSource(type="GrammarPoint", id="particle-ga:N5", title="\u304c", meaningVi="chu ngu moi"),
        KnowledgeSource(type="Vocabulary", id="noise-2", title="other"),
    ]

    precision_at_3, recall = source_metrics(sources, ("\u306f", "\u304c"))

    assert precision_at_3 == 0.67
    assert recall == 1


def test_rag_benchmark_merge_sources_removes_duplicate_items() -> None:
    duplicate_vector = KnowledgeSource(type="GrammarPoint", id="vector-wa", title="\u306f", reading="")
    duplicate_kg = KnowledgeSource(type="GrammarPoint", id="kg-wa", title="\u306f", reading="")
    graph_only = KnowledgeSource(type="GrammarPoint", id="kg-ga", title="\u304c", reading="")

    merged = merge_sources([duplicate_vector], [duplicate_kg, graph_only], limit=8)

    assert [source.id for source in merged] == ["vector-wa", "kg-ga"]


def test_rag_benchmark_dry_run_writes_appendix_ready_question_csv(tmp_path) -> None:
    output = tmp_path / "rag_benchmark_questions.csv"

    write_question_set(output)

    with output.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    assert len(rows) == 50
    assert rows[0]["question_id"] == "Q001"
    assert set(rows[0]) == {"question_id", "level", "category", "question", "expected_terms"}
