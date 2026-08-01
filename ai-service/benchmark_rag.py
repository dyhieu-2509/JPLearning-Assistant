from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = PROJECT_ROOT / "docs" / "rag_benchmark_results.csv"
MODES = ("llm_only", "vector_only", "kg_only", "kg_vector")


@dataclass(frozen=True)
class BenchmarkQuestion:
    question_id: str
    level: str
    category: str
    question: str
    expected_terms: tuple[str, ...]


BENCHMARK_QUESTIONS: tuple[BenchmarkQuestion, ...] = (
    BenchmarkQuestion("Q001", "N5", "particle", "Khi nao dung は va が?", ("は", "が", "particle", "chu de")),
    BenchmarkQuestion("Q002", "N5", "particle", "を dung trong cau tieng Nhat nhu the nao?", ("を", "object", "tan ngu")),
    BenchmarkQuestion("Q003", "N5", "particle", "に va で khac nhau the nao?", ("に", "で", "place")),
    BenchmarkQuestion("Q004", "N5", "particle", "へ co giong に khi noi ve huong di khong?", ("へ", "に", "direction")),
    BenchmarkQuestion("Q005", "N5", "particle", "も dung de noi cung vay nhu the nao?", ("も", "also", "cung")),
    BenchmarkQuestion("Q006", "N5", "particle", "と dung de noi di voi ai nhu the nao?", ("と", "with", "cung voi")),
    BenchmarkQuestion("Q007", "N5", "particle", "から va まで dung trong thoi gian ra sao?", ("から", "まで", "from")),
    BenchmarkQuestion("Q008", "N5", "particle", "の dung de noi so huu nhu the nao?", ("の", "possessive", "so huu")),
    BenchmarkQuestion("Q009", "N4", "particle", "より dung khi so sanh nhu the nao?", ("より", "comparison", "so sanh")),
    BenchmarkQuestion("Q010", "N4", "particle", "しか dung voi phu dinh co nghia gi?", ("しか", "only", "phu dinh")),
    BenchmarkQuestion("Q011", "N5", "verb", "ます form la gi?", ("ます", "polite", "verb")),
    BenchmarkQuestion("Q012", "N5", "verb", "Dictionary form cua たべます la gi?", ("食べる", "たべる", "dictionary")),
    BenchmarkQuestion("Q013", "N5", "verb", "The past polite form cua いきます la gi?", ("行きました", "いきました", "past")),
    BenchmarkQuestion("Q014", "N5", "verb", "ない form dung de noi khong lam gi?", ("ない", "negative", "verb")),
    BenchmarkQuestion("Q015", "N5", "verb", "て form dung de noi ket noi hanh dong nhu the nao?", ("て", "te-form", "connect")),
    BenchmarkQuestion("Q016", "N4", "verb", "たい form dung de noi muon lam gi?", ("たい", "want", "verb")),
    BenchmarkQuestion("Q017", "N4", "verb", "たことがある co nghia gi?", ("ことがある", "experience", "kinh nghiem")),
    BenchmarkQuestion("Q018", "N4", "verb", "てもいい dung de xin phep nhu the nao?", ("てもいい", "permission", "duoc")),
    BenchmarkQuestion("Q019", "N4", "verb", "なければならない co nghia gi?", ("なければならない", "must", "phai")),
    BenchmarkQuestion("Q020", "N4", "verb", "てしまう dung trong ngu canh nao?", ("てしまう", "complete", "regret")),
    BenchmarkQuestion("Q021", "N5", "grammar", "です dung nhu the nao trong cau co ban?", ("です", "copula", "la")),
    BenchmarkQuestion("Q022", "N5", "grammar", "あります va います khac nhau the nao?", ("あります", "います", "exist")),
    BenchmarkQuestion("Q023", "N5", "grammar", "ここ そこ あそこ khac nhau nhu the nao?", ("ここ", "そこ", "あそこ")),
    BenchmarkQuestion("Q024", "N5", "grammar", "これはなんですか co cau truc ra sao?", ("なん", "ですか", "what")),
    BenchmarkQuestion("Q025", "N5", "grammar", "A は B です co nghia gi?", ("は", "です", "sentence")),
    BenchmarkQuestion("Q026", "N5", "grammar", "い adjective chia phu dinh nhu the nao?", ("い", "adjective", "negative")),
    BenchmarkQuestion("Q027", "N5", "grammar", "な adjective dung truoc danh tu nhu the nao?", ("な", "adjective", "noun")),
    BenchmarkQuestion("Q028", "N4", "grammar", "ので va から khac nhau the nao?", ("ので", "から", "reason")),
    BenchmarkQuestion("Q029", "N4", "grammar", "ながら dung de noi lam hai viec ra sao?", ("ながら", "while", "two actions")),
    BenchmarkQuestion("Q030", "N4", "grammar", "そうです dung khi nghe noi nhu the nao?", ("そうです", "heard", "seem")),
    BenchmarkQuestion("Q031", "N4", "grammar", "ようになる co nghia gi?", ("ようになる", "become", "change")),
    BenchmarkQuestion("Q032", "N4", "grammar", "ほうがいい dung de khuyen nhu the nao?", ("ほうがいい", "advice", "should")),
    BenchmarkQuestion("Q033", "N5", "vocabulary", "たべる nghia la gi va dung khi nao?", ("食べる", "たべる", "eat")),
    BenchmarkQuestion("Q034", "N5", "vocabulary", "のむ nghia la gi?", ("飲む", "のむ", "drink")),
    BenchmarkQuestion("Q035", "N5", "vocabulary", "いく va くる khac nhau the nao?", ("行く", "来る", "go")),
    BenchmarkQuestion("Q036", "N5", "vocabulary", "みる dung de noi xem hay nhin nhu the nao?", ("見る", "みる", "see")),
    BenchmarkQuestion("Q037", "N5", "vocabulary", "きく co the co nghia nghe va hoi khong?", ("聞く", "きく", "listen")),
    BenchmarkQuestion("Q038", "N4", "vocabulary", "はじめる dung voi dong tu nhu the nao?", ("始める", "はじめる", "start")),
    BenchmarkQuestion("Q039", "N4", "vocabulary", "おわる dung trong cau ra sao?", ("終わる", "おわる", "finish")),
    BenchmarkQuestion("Q040", "N4", "vocabulary", "つかれる nghia la gi?", ("疲れる", "つかれる", "tired")),
    BenchmarkQuestion("Q041", "N5", "kanji", "日 co nhung cach doc co ban nao?", ("日", "にち", "ひ")),
    BenchmarkQuestion("Q042", "N5", "kanji", "月 co nghia gi va doc la gi?", ("月", "げつ", "つき")),
    BenchmarkQuestion("Q043", "N5", "kanji", "人 doc la ひと hay じん khi nao?", ("人", "ひと", "じん")),
    BenchmarkQuestion("Q044", "N5", "kanji", "学 trong 学生 co nghia gi?", ("学", "学生", "study")),
    BenchmarkQuestion("Q045", "N5", "kanji", "行 trong 行きます doc nhu the nao?", ("行", "いきます", "go")),
    BenchmarkQuestion("Q046", "N4", "kanji", "駅 co nghia gi?", ("駅", "えき", "station")),
    BenchmarkQuestion("Q047", "N4", "kanji", "会 trong 会社 co nghia gi?", ("会", "会社", "company")),
    BenchmarkQuestion("Q048", "N4", "kanji", "電 trong 電車 co nghia gi?", ("電", "電車", "electric")),
    BenchmarkQuestion("Q049", "N4", "usage", "Lam sao noi toi muon hoc tieng Nhat?", ("日本語", "勉強", "たい")),
    BenchmarkQuestion("Q050", "N4", "usage", "Lam sao hoi nha ga o dau?", ("駅", "どこ", "ですか")),
)


def source_text(source) -> str:
    parts = [
        getattr(source, "id", ""),
        getattr(source, "type", ""),
        getattr(source, "title", ""),
        getattr(source, "reading", ""),
        getattr(source, "meaningVi", ""),
        getattr(source, "meaningEn", ""),
        getattr(source, "source", ""),
    ]
    return " ".join(str(part).lower() for part in parts)


def is_relevant(source, expected_terms: Iterable[str]) -> bool:
    text = source_text(source)
    return any(str(term).lower() in text for term in expected_terms)


def source_metrics(sources: list, expected_terms: Iterable[str]) -> tuple[float, int]:
    top3 = sources[:3]
    if not top3:
        return 0.0, 0
    relevant_top3 = sum(1 for source in top3 if is_relevant(source, expected_terms))
    recall = 1 if any(is_relevant(source, expected_terms) for source in sources) else 0
    return round(relevant_top3 / 3, 2), recall


def merge_sources(*source_groups, limit: int = 8) -> list:
    seen: set[tuple[str, str, str]] = set()
    merged = []
    for source_group in source_groups:
        for source in source_group:
            key = (
                str(getattr(source, "type", "")),
                str(getattr(source, "title", "")),
                str(getattr(source, "reading", "")),
            )
            if key in seen:
                continue
            seen.add(key)
            merged.append(source)
            if len(merged) >= limit:
                return merged
    return merged


def get_sources(mode: str, question: BenchmarkQuestion, neo4j_reader, qdrant_client) -> list:
    if mode == "llm_only":
        return []

    graph_sources = []
    vector_sources = []
    if mode in {"kg_only", "kg_vector"}:
        graph_sources = neo4j_reader.search(question.question, level=question.level, limit=5)
    if mode in {"vector_only", "kg_vector"}:
        vector_sources = qdrant_client.search(question.question, level=question.level, limit=5)

    if mode == "kg_only":
        return graph_sources
    if mode == "vector_only":
        return vector_sources
    return merge_sources(vector_sources, graph_sources)


def format_sources(sources: list) -> str:
    values = []
    for source in sources[:8]:
        values.append(
            f"{getattr(source, 'type', '')}:{getattr(source, 'id', '')}:"
            f"{getattr(source, 'title', '')}:{getattr(source, 'reading', '')}"
        )
    return " | ".join(values)


def write_question_set(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["question_id", "level", "category", "question", "expected_terms"],
        )
        writer.writeheader()
        for item in BENCHMARK_QUESTIONS:
            writer.writerow(
                {
                    "question_id": item.question_id,
                    "level": item.level,
                    "category": item.category,
                    "question": item.question,
                    "expected_terms": "|".join(item.expected_terms),
                }
            )


def run_benchmark(output: Path, selected_modes: list[str], limit: int | None) -> None:
    from app.config.settings import get_settings
    from app.domain.schemas import StudentProfileContext
    from app.infrastructure.graphdb.neo4j_reader import Neo4jReader
    from app.infrastructure.llm.langchain_client import LangChainClient
    from app.infrastructure.vectordb.qdrant_client import QdrantVectorClient

    settings = get_settings()
    neo4j_reader = Neo4jReader(settings)
    qdrant_client = QdrantVectorClient(settings)
    llm_client = LangChainClient(settings)
    profile = StudentProfileContext(
        userId="benchmark",
        currentLevel="N5",
        targetLevel="N4",
        goal="JLPT preparation",
        learningPathway="jlpt_foundation",
        dailyStudyMinutes=30,
        explanationStyle="concise",
        romajiEnabled=True,
        weakSkills=[],
    )

    questions = BENCHMARK_QUESTIONS[:limit] if limit else BENCHMARK_QUESTIONS
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8-sig") as handle:
        fieldnames = [
            "question_id",
            "level",
            "category",
            "mode",
            "question",
            "expected_terms",
            "precision_at_3",
            "source_recall",
            "top_sources",
            "answer",
            "correctness_0_2",
            "faithfulness_0_2",
            "clarity_0_2",
            "reviewer_note",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for question in questions:
            for mode in selected_modes:
                try:
                    sources = get_sources(mode, question, neo4j_reader, qdrant_client)
                    precision_at_3, source_recall = source_metrics(sources, question.expected_terms)
                    answer = llm_client.generate_tutor_answer(question.question, sources, profile=profile)
                    error = ""
                except Exception as exc:  # noqa: BLE001 - benchmark must keep running.
                    sources = []
                    precision_at_3 = 0.0
                    source_recall = 0
                    answer = ""
                    error = f"ERROR: {exc}"
                writer.writerow(
                    {
                        "question_id": question.question_id,
                        "level": question.level,
                        "category": question.category,
                        "mode": mode,
                        "question": question.question,
                        "expected_terms": "|".join(question.expected_terms),
                        "precision_at_3": precision_at_3,
                        "source_recall": source_recall,
                        "top_sources": format_sources(sources),
                        "answer": answer,
                        "correctness_0_2": "",
                        "faithfulness_0_2": "",
                        "clarity_0_2": "",
                        "reviewer_note": error,
                    }
                )
    neo4j_reader.close()
    qdrant_client.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the JPLearning RAG benchmark.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="CSV output path.")
    parser.add_argument("--limit", type=int, default=None, help="Optional question limit for smoke runs.")
    parser.add_argument(
        "--modes",
        nargs="+",
        choices=MODES,
        default=list(MODES),
        help="Retrieval modes to run.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only write the benchmark question set without calling Neo4j, Qdrant, or LLM.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.dry_run:
        write_question_set(args.output)
    else:
        run_benchmark(args.output, args.modes, args.limit)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
