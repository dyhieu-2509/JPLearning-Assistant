"""
JPLearning Assistant — Data Loader for Neo4j Knowledge Graph
============================================================
Loads JLPT N5/N4 data from CSV/YAML datasets into Neo4j.

Usage:
    python data_loader.py [--dry-run] [--level N5] [--neo4j-uri bolt://localhost:7687]

Data Sources:
    - datasets/JLPT_Vocabulary/data/vocab/results/JLPT_vocab_ALL.csv
    - datasets/JLPT_Vocabulary/data/kanji/results/JLPT_kanji_ALL.csv
    - datasets/MinnaNoDS/minna-no-ds.yaml
    - datasets/JLPT_Grammar_Full.csv
"""

import csv
import yaml
import re
import argparse
import logging
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path constants (relative to project root)
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
VOCAB_CSV = PROJECT_ROOT / "datasets" / "JLPT_Vocabulary" / "data" / "vocab" / "results" / "JLPT_vocab_ALL.csv"
KANJI_CSV = PROJECT_ROOT / "datasets" / "JLPT_Vocabulary" / "data" / "kanji" / "results" / "JLPT_kanji_ALL.csv"
MINNA_YAML = PROJECT_ROOT / "datasets" / "MinnaNoDS" / "minna-no-ds.yaml"
GRAMMAR_CSV = PROJECT_ROOT / "datasets" / "JLPT_Grammar_Clean.csv"

# JLPT level mapping: CSV uses numeric 1-5, we map to N1-N5
LEVEL_MAP = {1: "N1", 2: "N2", 3: "N3", 4: "N4", 5: "N5"}


# ===========================================================================
#  Parsers
# ===========================================================================

def parse_vocabulary(filepath: Path, target_levels: list[str]) -> list[dict]:
    """
    Parse JLPT_vocab_ALL.csv
    Format: Kanji,Reading,Level (numeric 1-5)
    Returns list of dicts: {kanji, reading, level}
    """
    items: list[dict] = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            level_str = LEVEL_MAP.get(int(row["Level"]), "")
            if level_str in target_levels:
                items.append({
                    "kanji": row["Kanji"].strip(),
                    "reading": row["Reading"].strip(),
                    "level": level_str,
                })
    logger.info(f"Parsed {len(items)} vocabulary items from {filepath.name}")
    return items


def parse_kanji(filepath: Path, target_levels: list[str]) -> list[dict]:
    """
    Parse JLPT_kanji_ALL.csv
    Format: Kanji (header), then rows like: 漢字,Level (no header for level)
    The CSV has header "Kanji" and each row is "character,level_number"
    """
    items: list[dict] = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        # First line is header "Kanji"
        lines = f.readlines()

    for line in lines[1:]:  # Skip header
        line = line.strip()
        if not line:
            continue
        parts = line.split(",")
        if len(parts) >= 2:
            character = parts[0].strip()
            try:
                level_num = int(parts[1].strip())
            except ValueError:
                continue
            level_str = LEVEL_MAP.get(level_num, "")
            if level_str in target_levels:
                items.append({
                    "character": character,
                    "level": level_str,
                })
    logger.info(f"Parsed {len(items)} kanji items from {filepath.name}")
    return items


def parse_minna_vocabulary(filepath: Path, max_lesson: int = 25) -> list[dict]:
    """
    Parse minna-no-ds.yaml (Minna no Nihongo)
    Lessons 1-25 ≈ N5, Lessons 26-50 ≈ N4
    Returns list of dicts: {kanji, kana, romaji, meaning_en, lesson_id, level}
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    items: list[dict] = []
    for lesson_info in data.get("lessons", []):
        lesson_id = lesson_info["id"]
        lesson_key = lesson_info["key"]

        if lesson_id > 50:
            continue

        level = "N5" if lesson_id <= 25 else "N4"
        lesson_data = data.get(lesson_key, [])

        if not lesson_data:
            continue

        for word in lesson_data:
            items.append({
                "kanji": word.get("kanji") or "",
                "kana": word.get("kana", ""),
                "romaji": word.get("romaji", ""),
                "meaning_en": word.get("meaning", {}).get("en", ""),
                "lesson_id": lesson_id,
                "level": level,
            })

    logger.info(f"Parsed {len(items)} Minna vocabulary items from {filepath.name}")
    return items


def parse_grammar(filepath: Path, target_levels: list[str]) -> list[dict]:
    """
    Parse JLPT_Grammar_Clean.csv (cleaned version)
    Format: level,grammar_pattern,meaning_en,meaning_vi
    """
    items: list[dict] = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            level = row.get("level", "").strip()
            if level not in target_levels:
                continue

            pattern = row.get("grammar_pattern", "").strip()
            meaning_en = row.get("meaning_en", "").strip()
            meaning_vi = row.get("meaning_vi", "").strip()

            if pattern:
                items.append({
                    "pattern": pattern,
                    "meaning_en": meaning_en,
                    "meaning_vi": meaning_vi,
                    "level": level,
                })

    logger.info(f"Parsed {len(items)} grammar items from {filepath.name}")
    return items


# ===========================================================================
#  Neo4j Loader
# ===========================================================================

def get_neo4j_driver(uri: str, user: str, password: str):
    """Create a Neo4j driver instance."""
    from neo4j import GraphDatabase
    return GraphDatabase.driver(uri, auth=(user, password))


def create_constraints(driver) -> None:
    """Create uniqueness constraints and indexes in Neo4j."""
    constraints = [
        "CREATE CONSTRAINT vocab_unique IF NOT EXISTS FOR (v:Vocabulary) REQUIRE (v.reading, v.level) IS UNIQUE",
        "CREATE CONSTRAINT kanji_unique IF NOT EXISTS FOR (k:Kanji) REQUIRE k.character IS UNIQUE",
        "CREATE CONSTRAINT grammar_unique IF NOT EXISTS FOR (g:GrammarPoint) REQUIRE (g.pattern, g.level) IS UNIQUE",
        "CREATE CONSTRAINT lesson_unique IF NOT EXISTS FOR (l:Lesson) REQUIRE l.lesson_id IS UNIQUE",
        "CREATE CONSTRAINT level_unique IF NOT EXISTS FOR (lv:JLPTLevel) REQUIRE lv.name IS UNIQUE",
        "CREATE INDEX vocab_level_idx IF NOT EXISTS FOR (v:Vocabulary) ON (v.level)",
        "CREATE INDEX vocab_romaji_idx IF NOT EXISTS FOR (v:Vocabulary) ON (v.romaji)",
        "CREATE INDEX kanji_level_idx IF NOT EXISTS FOR (k:Kanji) ON (k.level)",
        "CREATE INDEX grammar_level_idx IF NOT EXISTS FOR (g:GrammarPoint) ON (g.level)",
    ]
    with driver.session() as session:
        for stmt in constraints:
            session.run(stmt)
    logger.info(f"Created {len(constraints)} constraints/indexes")


def load_jlpt_levels(driver, levels: list[str]) -> None:
    """Create JLPT level nodes."""
    cypher = """
    UNWIND $levels AS level_name
    MERGE (lv:JLPTLevel {name: level_name})
    """
    with driver.session() as session:
        session.run(cypher, levels=levels)
    logger.info(f"Created {len(levels)} JLPTLevel nodes")


def load_vocabulary(driver, items: list[dict]) -> None:
    """Load vocabulary nodes and link to JLPTLevel."""
    cypher = """
    UNWIND $items AS item
    MERGE (v:Vocabulary {reading: item.reading, level: item.level})
    SET v.kanji = CASE WHEN item.kanji <> '' THEN item.kanji ELSE coalesce(v.kanji, '') END,
        v.source = coalesce(v.source, 'JLPT')
    WITH v, item
    MATCH (lv:JLPTLevel {name: item.level})
    MERGE (v)-[:BELONGS_TO]->(lv)
    """
    _batch_execute(driver, cypher, items, "Vocabulary")


def load_kanji(driver, items: list[dict]) -> None:
    """Load kanji nodes and link to JLPTLevel."""
    cypher = """
    UNWIND $items AS item
    MERGE (k:Kanji {character: item.character})
    SET k.level = item.level
    WITH k, item
    MATCH (lv:JLPTLevel {name: item.level})
    MERGE (k)-[:BELONGS_TO]->(lv)
    """
    _batch_execute(driver, cypher, items, "Kanji")


def load_grammar(driver, items: list[dict]) -> None:
    """Load grammar point nodes and link to JLPTLevel."""
    cypher = """
    UNWIND $items AS item
    MERGE (g:GrammarPoint {pattern: item.pattern, level: item.level})
    SET g.meaning_en = item.meaning_en,
        g.meaning_vi = item.meaning_vi
    WITH g, item
    MATCH (lv:JLPTLevel {name: item.level})
    MERGE (g)-[:BELONGS_TO]->(lv)
    """
    _batch_execute(driver, cypher, items, "GrammarPoint")


def load_minna_lessons(driver, items: list[dict]) -> None:
    """Load Minna no Nihongo lessons and vocabulary with lesson relationships."""
    # First, create Lesson nodes
    lesson_ids = list(set(item["lesson_id"] for item in items))
    lesson_cypher = """
    UNWIND $lessons AS lid
    MERGE (l:Lesson {lesson_id: lid})
    SET l.name = 'Minna no Nihongo Lesson ' + toString(lid),
        l.source = 'MinnaNoDS',
        l.level = CASE WHEN lid <= 25 THEN 'N5' ELSE 'N4' END
    WITH l
    MATCH (lv:JLPTLevel {name: l.level})
    MERGE (l)-[:BELONGS_TO]->(lv)
    """
    with driver.session() as session:
        session.run(lesson_cypher, lessons=lesson_ids)
    logger.info(f"Created {len(lesson_ids)} Lesson nodes")

    # Then, create vocabulary with lesson links
    vocab_cypher = """
    UNWIND $items AS item
    MERGE (v:Vocabulary {reading: item.kana, level: item.level})
    SET v.kanji = CASE WHEN item.kanji <> '' THEN item.kanji ELSE coalesce(v.kanji, '') END,
        v.romaji = item.romaji,
        v.meaning_en = item.meaning_en,
        v.source = 'MinnaNoDS'
    WITH v, item
    MATCH (l:Lesson {lesson_id: item.lesson_id})
    MERGE (v)-[:TAUGHT_IN]->(l)
    """
    _batch_execute(driver, vocab_cypher, items, "Minna Vocabulary")


def link_vocab_to_kanji(driver) -> None:
    """Create USES_KANJI relationships between Vocabulary and Kanji nodes."""
    cypher = """
    MATCH (v:Vocabulary)
    WHERE v.kanji IS NOT NULL AND v.kanji <> ''
    WITH v, v.kanji AS word
    MATCH (k:Kanji)
    WHERE word CONTAINS k.character
    MERGE (v)-[:USES_KANJI]->(k)
    """
    with driver.session() as session:
        result = session.run(cypher)
        summary = result.consume()
        logger.info(
            f"Created USES_KANJI relationships: "
            f"{summary.counters.relationships_created} relationships"
        )


def _batch_execute(
    driver, cypher: str, items: list[dict], label: str, batch_size: int = 500
) -> None:
    """Execute Cypher in batches for better performance."""
    total = len(items)
    with driver.session() as session:
        for i in range(0, total, batch_size):
            batch = items[i : i + batch_size]
            session.run(cypher, items=batch)
            logger.info(f"  Loaded {label}: {min(i + batch_size, total)}/{total}")
    logger.info(f"Finished loading {total} {label} nodes")


# ===========================================================================
#  Dry-run: generate Cypher file instead of connecting to Neo4j
# ===========================================================================

def generate_cypher_file(
    vocab: list[dict],
    kanji: list[dict],
    grammar: list[dict],
    minna: list[dict],
    output: Path,
) -> None:
    """Generate a .cypher file for manual import."""
    with open(output, "w", encoding="utf-8") as f:
        f.write("// ============================================\n")
        f.write("// JPLearning Assistant — Knowledge Graph Seed\n")
        f.write("// Auto-generated by data_loader.py\n")
        f.write("// ============================================\n\n")

        # Constraints
        f.write("// --- Constraints ---\n")
        f.write("CREATE CONSTRAINT vocab_unique IF NOT EXISTS FOR (v:Vocabulary) REQUIRE (v.reading, v.level) IS UNIQUE;\n")
        f.write("CREATE CONSTRAINT kanji_unique IF NOT EXISTS FOR (k:Kanji) REQUIRE k.character IS UNIQUE;\n")
        f.write("CREATE CONSTRAINT grammar_unique IF NOT EXISTS FOR (g:GrammarPoint) REQUIRE (g.pattern, g.level) IS UNIQUE;\n")
        f.write("CREATE CONSTRAINT lesson_unique IF NOT EXISTS FOR (l:Lesson) REQUIRE l.lesson_id IS UNIQUE;\n")
        f.write("CREATE CONSTRAINT level_unique IF NOT EXISTS FOR (lv:JLPTLevel) REQUIRE lv.name IS UNIQUE;\n\n")
        f.write("CREATE INDEX vocab_level_idx IF NOT EXISTS FOR (v:Vocabulary) ON (v.level);\n")
        f.write("CREATE INDEX vocab_romaji_idx IF NOT EXISTS FOR (v:Vocabulary) ON (v.romaji);\n")
        f.write("CREATE INDEX kanji_level_idx IF NOT EXISTS FOR (k:Kanji) ON (k.level);\n")
        f.write("CREATE INDEX grammar_level_idx IF NOT EXISTS FOR (g:GrammarPoint) ON (g.level);\n\n")

        # JLPT Levels
        f.write("// --- JLPT Levels ---\n")
        f.write("MERGE (:JLPTLevel {name: 'N5'});\n")
        f.write("MERGE (:JLPTLevel {name: 'N4'});\n\n")

        # Vocabulary
        f.write(f"// --- Vocabulary ({len(vocab)} items) ---\n")
        for v in vocab:
            kanji_escaped = _escape_cypher(v["kanji"])
            reading_escaped = _escape_cypher(v["reading"])
            f.write(
                f"MERGE (v:Vocabulary {{reading: '{reading_escaped}', level: '{v['level']}'}}) "
                f"SET v.kanji = CASE WHEN '{kanji_escaped}' <> '' THEN '{kanji_escaped}' ELSE coalesce(v.kanji, '') END, "
                f"v.source = coalesce(v.source, 'JLPT');\n"
            )

        # Minna no Nihongo lessons and vocabulary
        lesson_ids = sorted(set(item["lesson_id"] for item in minna))
        f.write(f"\n// --- Minna no Nihongo Lessons ({len(lesson_ids)} lessons) ---\n")
        for lesson_id in lesson_ids:
            level = "N5" if lesson_id <= 25 else "N4"
            f.write(
                f"MERGE (l:Lesson {{lesson_id: {lesson_id}}}) "
                f"SET l.name = 'Minna no Nihongo Lesson {lesson_id}', "
                f"l.source = 'MinnaNoDS', l.level = '{level}';\n"
            )
            f.write(
                f"MATCH (l:Lesson {{lesson_id: {lesson_id}}}), "
                f"(lv:JLPTLevel {{name: '{level}'}}) "
                f"MERGE (l)-[:BELONGS_TO]->(lv);\n"
            )

        f.write(f"\n// --- Minna Vocabulary ({len(minna)} items) ---\n")
        for item in minna:
            kanji_escaped = _escape_cypher(item["kanji"])
            kana_escaped = _escape_cypher(item["kana"])
            romaji_escaped = _escape_cypher(item["romaji"])
            meaning_en_escaped = _escape_cypher(item["meaning_en"])
            f.write(
                f"MERGE (v:Vocabulary {{reading: '{kana_escaped}', level: '{item['level']}'}}) "
                f"SET v.kanji = CASE WHEN '{kanji_escaped}' <> '' THEN '{kanji_escaped}' ELSE coalesce(v.kanji, '') END, "
                f"v.romaji = '{romaji_escaped}', "
                f"v.meaning_en = '{meaning_en_escaped}', "
                f"v.source = 'MinnaNoDS';\n"
            )
            f.write(
                f"MATCH (v:Vocabulary {{reading: '{kana_escaped}', level: '{item['level']}'}}), "
                f"(l:Lesson {{lesson_id: {item['lesson_id']}}}) "
                f"MERGE (v)-[:TAUGHT_IN]->(l);\n"
            )

        # Kanji
        f.write(f"\n// --- Kanji ({len(kanji)} items) ---\n")
        for k in kanji:
            char_escaped = _escape_cypher(k["character"])
            f.write(
                f"MERGE (:Kanji {{character: '{char_escaped}', level: '{k['level']}'}});\n"
            )

        # Grammar
        f.write(f"\n// --- Grammar ({len(grammar)} items) ---\n")
        for g in grammar:
            pattern_escaped = _escape_cypher(g["pattern"])
            meaning_en_escaped = _escape_cypher(g["meaning_en"])
            meaning_vi_escaped = _escape_cypher(g["meaning_vi"])
            f.write(
                f"MERGE (g:GrammarPoint {{pattern: '{pattern_escaped}', level: '{g['level']}'}}) "
                f"SET g.meaning_en = '{meaning_en_escaped}', "
                f"g.meaning_vi = '{meaning_vi_escaped}';\n"
            )

        # Summary
        f.write(f"\n// --- Summary ---\n")
        f.write(f"// Vocabulary: {len(vocab)}\n")
        f.write(f"// Kanji: {len(kanji)}\n")
        f.write(f"// Grammar: {len(grammar)}\n")
        f.write(f"// Minna Vocabulary: {len(minna)}\n")

    logger.info(f"Generated Cypher file: {output}")


def _escape_cypher(text: str) -> str:
    """Escape single quotes for Cypher strings."""
    if not text:
        return ""
    return text.replace("\\", "\\\\").replace("'", "\\'")


# ===========================================================================
#  Main
# ===========================================================================

def main():
    parser = argparse.ArgumentParser(description="Load JLPT data into Neo4j")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate Cypher file instead of loading into Neo4j",
    )
    parser.add_argument(
        "--level",
        nargs="+",
        default=["N5", "N4"],
        help="JLPT levels to load (default: N5 N4)",
    )
    parser.add_argument("--neo4j-uri", default="bolt://localhost:7687")
    parser.add_argument("--neo4j-user", default="neo4j")
    parser.add_argument("--neo4j-password", default="neo4jpassword")
    parser.add_argument(
        "--output",
        default=str(PROJECT_ROOT / "docs" / "seed_knowledge_graph.cypher"),
        help="Output path for dry-run Cypher file",
    )
    args = parser.parse_args()

    target_levels = args.level
    logger.info(f"Target JLPT levels: {target_levels}")

    # --- Parse all datasets ---
    vocab = parse_vocabulary(VOCAB_CSV, target_levels)
    kanji = parse_kanji(KANJI_CSV, target_levels)
    grammar = parse_grammar(GRAMMAR_CSV, target_levels)
    minna = parse_minna_vocabulary(MINNA_YAML)

    logger.info(
        f"Total parsed: {len(vocab)} vocab, {len(kanji)} kanji, "
        f"{len(grammar)} grammar, {len(minna)} minna"
    )

    if args.dry_run:
        generate_cypher_file(vocab, kanji, grammar, minna, Path(args.output))
        return

    # --- Load into Neo4j ---
    driver = get_neo4j_driver(args.neo4j_uri, args.neo4j_user, args.neo4j_password)
    try:
        create_constraints(driver)
        load_jlpt_levels(driver, target_levels)
        load_vocabulary(driver, vocab)
        load_kanji(driver, kanji)
        load_grammar(driver, grammar)
        load_minna_lessons(driver, minna)
        link_vocab_to_kanji(driver)
        logger.info("✅ All data loaded successfully!")
    finally:
        driver.close()


if __name__ == "__main__":
    main()
