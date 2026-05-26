"""
Clean the corrupted JLPT_Grammar_Full.csv
==========================================
The original CSV has two issues:
1. BOM character in the header (\\ufeff)
2. meaning_en/meaning_vi columns contain concatenated entries:
   - Real meaning + "NUMBERnext_pattern" + Japanese + meaning + ...

This script extracts only the FIRST (real) meaning from each row
and generates a clean CSV at datasets/JLPT_Grammar_Clean.csv

Usage:
    python clean_grammar.py
"""

import csv
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_CSV = PROJECT_ROOT / "datasets" / "JLPT_Grammar_Full.csv"
OUTPUT_CSV = PROJECT_ROOT / "datasets" / "JLPT_Grammar_Clean.csv"


def extract_first_meaning(raw: str) -> str:
    """
    Extract only the first (real) meaning from a corrupted meaning field.

    The concatenated data pattern:
      "actual meaning here 2da / desuだ / ですto be..."
      "must not do (spoken Japanese)2da / desuだ..."

    We cut at the first occurrence of: a digit followed by
    a lowercase ASCII letter (marking the next grammar entry's number + romaji).
    """
    if not raw:
        return ""

    # Pattern: digit(s) immediately followed by a lowercase letter
    # This matches "2da", "3dake", "5de", "11ga", "21ka" etc.
    match = re.search(r'\d+[a-z]', raw)
    if match:
        return raw[:match.start()].strip().rstrip(";").strip()
    return raw.strip()


def clean_grammar():
    items = []

    with open(INPUT_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        print(f"Headers: {reader.fieldnames}")

        for row in reader:
            level = row.get("level", "").strip()
            pattern = row.get("grammar_pattern", "").strip()
            meaning_en_raw = row.get("meaning_en", "")
            meaning_vi_raw = row.get("meaning_vi", "")

            meaning_en = extract_first_meaning(meaning_en_raw)
            meaning_vi = extract_first_meaning(meaning_vi_raw)

            if pattern and level:
                items.append({
                    "level": level,
                    "grammar_pattern": pattern,
                    "meaning_en": meaning_en,
                    "meaning_vi": meaning_vi,
                })

    # Deduplicate by (level, pattern)
    seen = set()
    unique_items = []
    for item in items:
        key = (item["level"], item["grammar_pattern"])
        if key not in seen:
            seen.add(key)
            unique_items.append(item)

    # Write clean CSV
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["level", "grammar_pattern", "meaning_en", "meaning_vi"],
        )
        writer.writeheader()
        writer.writerows(unique_items)

    print(f"\n=== Results ===")
    print(f"Total raw rows: {len(items)}")
    print(f"After dedup:    {len(unique_items)}")

    # Stats per level
    from collections import Counter
    level_counts = Counter(item["level"] for item in unique_items)
    for level, count in sorted(level_counts.items()):
        print(f"  {level}: {count} grammar points")

    print(f"\nClean CSV written to: {OUTPUT_CSV}")

    # Show first 10 for verification
    print(f"\n=== Sample (first 10) ===")
    for item in unique_items[:10]:
        print(f"  [{item['level']}] {item['grammar_pattern']}")
        print(f"    EN: {item['meaning_en']}")
        print(f"    VI: {item['meaning_vi']}")
        print()


if __name__ == "__main__":
    clean_grammar()
