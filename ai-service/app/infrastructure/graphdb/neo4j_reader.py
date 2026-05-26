from __future__ import annotations

from typing import Any

from app.config.settings import Settings
from app.domain.schemas import KnowledgeSource

try:
    from neo4j import GraphDatabase
except ImportError:  # pragma: no cover - allows syntax checks before dependencies are installed.
    GraphDatabase = None


class Neo4jReader:
    """Read-only adapter for retrieving grounding context from Neo4j."""

    _QUERY = """
    WITH [term IN $terms WHERE term <> ''] AS terms
    MATCH (n)
    WITH n, terms,
         toLower(coalesce(n.kanji, '') + ' ' + coalesce(n.reading, '') + ' '
             + coalesce(n.romaji, '') + ' ' + coalesce(n.pattern, '') + ' '
             + coalesce(n.character, '') + ' ' + coalesce(n.meaning_vi, '') + ' '
             + coalesce(n.meaning_en, '')) AS searchable
    WHERE any(label IN labels(n) WHERE label IN ['Vocabulary', 'GrammarPoint', 'Kanji'])
      AND ($level = '' OR n.level = $level)
      AND (size(terms) = 0 OR any(term IN terms WHERE searchable CONTAINS term))
    WITH n,
         CASE WHEN coalesce(n.meaning_vi, '') <> '' OR coalesce(n.meaning_en, '') <> '' THEN 0 ELSE 1 END AS meaningRank
    RETURN labels(n)[0] AS type,
           coalesce(n.reading, n.pattern, n.character, elementId(n)) AS id,
           coalesce(n.kanji, n.pattern, n.character, n.reading, '') AS title,
           coalesce(n.reading, '') AS reading,
           coalesce(n.meaning_vi, '') AS meaningVi,
           coalesce(n.meaning_en, '') AS meaningEn,
           coalesce(n.level, '') AS level,
           coalesce(n.source, 'JLPT') AS source
    ORDER BY meaningRank, title
    LIMIT $limit
    """

    _ROMAJI_TO_HIRAGANA = {
        "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ",
        "sha": "しゃ", "shu": "しゅ", "sho": "しょ",
        "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ",
        "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ",
        "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ",
        "mya": "みゃ", "myu": "みゅ", "myo": "みょ",
        "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ",
        "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ",
        "ja": "じゃ", "ju": "じゅ", "jo": "じょ",
        "bya": "びゃ", "byu": "びゅ", "byo": "びょ",
        "pya": "ぴゃ", "pyu": "ぴゅ", "pyo": "ぴょ",
        "shi": "し", "chi": "ち", "tsu": "つ", "fu": "ふ", "ji": "じ",
        "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",
        "sa": "さ", "su": "す", "se": "せ", "so": "そ",
        "ta": "た", "te": "て", "to": "と",
        "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の",
        "ha": "は", "hi": "ひ", "he": "へ", "ho": "ほ",
        "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",
        "ya": "や", "yu": "ゆ", "yo": "よ",
        "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",
        "wa": "わ", "wo": "を",
        "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
        "za": "ざ", "zu": "ず", "ze": "ぜ", "zo": "ぞ",
        "da": "だ", "de": "で", "do": "ど",
        "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",
        "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",
        "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お", "n": "ん",
    }

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._driver: Any | None = None

    def search(self, query: str, level: str = "N5", limit: int = 5) -> list[KnowledgeSource]:
        """Search Neo4j for vocabulary, grammar, and kanji context."""
        if GraphDatabase is None:
            return []

        try:
            driver = self._get_driver()
            with driver.session() as session:
                records = session.run(
                    self._QUERY,
                    terms=self._build_search_terms(query),
                    level=level.strip().upper(),
                    limit=limit,
                )
                return [self._to_source(record.data()) for record in records]
        except Exception:
            return []

    def close(self) -> None:
        """Close the underlying Neo4j driver."""
        if self._driver is not None:
            self._driver.close()
            self._driver = None

    def _get_driver(self) -> Any:
        if self._driver is None:
            self._driver = GraphDatabase.driver(
                self._settings.neo4j_uri,
                auth=(self._settings.neo4j_user, self._settings.neo4j_password),
            )
        return self._driver

    def _to_source(self, data: dict[str, Any]) -> KnowledgeSource:
        return KnowledgeSource(
            type=str(data.get("type", "")),
            id=str(data.get("id", "")),
            title=str(data.get("title", "")),
            reading=str(data.get("reading", "")),
            meaningVi=str(data.get("meaningVi", "")),
            meaningEn=str(data.get("meaningEn", "")),
            level=str(data.get("level", "")),
            source=str(data.get("source", "")),
        )

    def _build_search_terms(self, query: str) -> list[str]:
        normalized = query.strip().lower()
        if not normalized:
            return []

        terms: list[str] = []
        self._add_term_with_kana_variant(terms, normalized)
        for part in normalized.split():
            if len(part) >= 2:
                self._add_term_with_kana_variant(terms, part)
        return terms

    def _add_term_with_kana_variant(self, terms: list[str], term: str) -> None:
        if term not in terms:
            terms.append(term)

        hiragana = self._romaji_to_hiragana(term)
        if hiragana != term and hiragana not in terms:
            terms.append(hiragana)
        self._add_polite_verb_variants(terms, term)
        self._add_polite_verb_variants(terms, hiragana)

    def _add_polite_verb_variants(self, terms: list[str], term: str) -> None:
        if term.endswith("ru") and len(term) > 2 and term.replace("-", "").isascii():
            self._add_term_with_kana_variant_without_polite_recursion(
                terms,
                f"{term[:-2]}masu",
            )
        if term.endswith("る") and len(term) > 1:
            candidate = f"{term[:-1]}ます"
            if candidate not in terms:
                terms.append(candidate)

    def _add_term_with_kana_variant_without_polite_recursion(
        self,
        terms: list[str],
        term: str,
    ) -> None:
        if term not in terms:
            terms.append(term)

        hiragana = self._romaji_to_hiragana(term)
        if hiragana != term and hiragana not in terms:
            terms.append(hiragana)

    def _romaji_to_hiragana(self, value: str) -> str:
        if not all(char.isalpha() or char in {" ", "-"} for char in value):
            return value
        if not value.isascii():
            return value

        text = value.replace("-", "")
        output: list[str] = []
        index = 0
        while index < len(text):
            current = text[index]
            if current == " ":
                output.append(" ")
                index += 1
                continue

            if self._is_double_consonant(text, index):
                output.append("っ")
                index += 1
                continue

            matched = ""
            for length in range(3, 0, -1):
                candidate = text[index : index + length]
                if candidate in self._ROMAJI_TO_HIRAGANA:
                    matched = candidate
                    break

            if not matched:
                return value

            output.append(self._ROMAJI_TO_HIRAGANA[matched])
            index += len(matched)

        return "".join(output)

    def _is_double_consonant(self, text: str, index: int) -> bool:
        if index + 1 >= len(text):
            return False
        current = text[index]
        return current == text[index + 1] and current in "bcdfghjklmpqrstvwxyz" and current != "n"
