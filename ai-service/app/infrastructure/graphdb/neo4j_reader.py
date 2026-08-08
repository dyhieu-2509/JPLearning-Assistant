from __future__ import annotations

import re
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
    WITH n, terms, searchable,
         reduce(score = 0, term IN terms |
             score + CASE
                 WHEN term <> '' AND searchable CONTAINS term
                 THEN CASE
                     WHEN term CONTAINS ' ' OR term CONTAINS '/' OR term CONTAINS '-' THEN 5
                     ELSE 1
                 END
                 ELSE 0
             END
         ) AS matchScore
    WHERE size(terms) = 0 OR matchScore > 0
    WITH n, matchScore,
         CASE WHEN coalesce(n.meaning_vi, '') <> '' OR coalesce(n.meaning_en, '') <> '' THEN 0 ELSE 1 END AS meaningRank
    RETURN labels(n)[0] AS type,
           coalesce(n.reading, n.pattern, n.character, elementId(n)) AS id,
           coalesce(n.kanji, n.pattern, n.character, n.reading, '') AS title,
           coalesce(n.reading, '') AS reading,
           coalesce(n.meaning_vi, '') AS meaningVi,
           coalesce(n.meaning_en, '') AS meaningEn,
           coalesce(n.level, '') AS level,
           coalesce(n.source, 'JLPT') AS source
    ORDER BY matchScore DESC, meaningRank, title
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

    _QUERY_EXPANSIONS = {
        "\u306f": ("wa - topic marker", "topic marker"),
        "\u304c": ("ga", "subject marker"),
        "\u3092": ("o / wo", "object marker particle"),
        "\u306b": ("ni", "destination particle"),
        "\u3067": ("de", "place"),
        "\u3078": ("ni/e", "direction", "destination"),
        "\u3082": ("mo", "also"),
        "\u3068": ("with", "together"),
        "\u304b\u3089": ("kara", "from"),
        "\u307e\u3067": ("made", "until"),
        "\u306e": ("no", "possessive particle"),
        "\u3088\u308a": ("yori", "comparison", "than"),
        "\u3057\u304b": ("shika", "only", "negative"),
        "\u307e\u3059": ("masu", "polite"),
        "\u306a\u3044": ("nai", "negative"),
        "\u305f\u3044": ("tai", "want"),
        "\u305f\u3053\u3068\u304c\u3042\u308b": ("koto ga aru", "experience"),
        "\u3066\u3082\u3044\u3044": ("temo ii", "permission"),
        "\u306a\u3051\u308c\u3070\u306a\u3089\u306a\u3044": ("nakereba naranai", "must"),
        "\u3066\u3057\u307e\u3046": ("te shimau", "complete", "regret"),
        "\u3067\u3059": ("da / desu", "to be"),
        "\u3042\u308a\u307e\u3059": ("arimasu", "exist"),
        "\u3044\u307e\u3059": ("imasu", "exist"),
        "\u306e\u3067": ("node", "reason"),
        "\u306a\u304c\u3089": ("nagara", "while"),
        "\u305d\u3046\u3067\u3059": ("sou desu", "heard", "seem"),
        "\u3088\u3046\u306b\u306a\u308b": ("you ni naru", "become"),
        "\u307b\u3046\u304c\u3044\u3044": ("hou ga ii", "advice", "should"),
        "tro tu": ("particle marker",),
        "tr\u1ee3 t\u1eeb": ("particle marker",),
        "chu de": ("wa - topic marker", "topic marker"),
        "ch\u1ee7 \u0111\u1ec1": ("wa - topic marker", "topic marker"),
        "chu ngu": ("ga", "subject marker"),
        "ch\u1ee7 ng\u1eef": ("ga", "subject marker"),
        "tan ngu": ("o / wo", "object marker particle"),
        "t\u00e2n ng\u1eef": ("o / wo", "object marker particle"),
        "dia diem": ("place", "ni", "de"),
        "\u0111\u1ecba \u0111i\u1ec3m": ("place", "ni", "de"),
        "huong di": ("ni/e", "direction", "destination"),
        "h\u01b0\u1edbng \u0111i": ("ni/e", "direction", "destination"),
        "cung vay": ("also", "mo"),
        "c\u0169ng v\u1eady": ("also", "mo"),
        "cung voi": ("with", "together"),
        "c\u00f9ng v\u1edbi": ("with", "together"),
        "thoi gian": ("kara", "made", "from", "until"),
        "th\u1eddi gian": ("kara", "made", "from", "until"),
        "so huu": ("no", "possessive particle"),
        "s\u1edf h\u1eefu": ("no", "possessive particle"),
        "so sanh": ("yori", "comparison", "than"),
        "so s\u00e1nh": ("yori", "comparison", "than"),
        "phu dinh": ("negative", "nai", "masen", "shika"),
        "ph\u1ee7 \u0111\u1ecbnh": ("negative", "nai", "masen", "shika"),
        "xin phep": ("temo ii", "permission"),
        "xin ph\u00e9p": ("temo ii", "permission"),
        "muon lam": ("tai", "want"),
        "mu\u1ed1n l\u00e0m": ("tai", "want"),
        "kinh nghiem": ("koto ga aru", "experience"),
        "kinh nghi\u1ec7m": ("koto ga aru", "experience"),
        "phai lam": ("nakereba naranai", "must"),
        "ph\u1ea3i l\u00e0m": ("nakereba naranai", "must"),
        "ton tai": ("arimasu", "imasu", "exist"),
        "t\u1ed3n t\u1ea1i": ("arimasu", "imasu", "exist"),
        "tinh tu": ("adjective",),
        "t\u00ednh t\u1eeb": ("adjective",),
        "ly do": ("node", "kara", "reason"),
        "l\u00fd do": ("node", "kara", "reason"),
        "nghe noi": ("sou desu", "heard"),
        "nghe n\u00f3i": ("sou desu", "heard"),
        "duong nhu": ("sou desu", "seem"),
        "d\u01b0\u1eddng nh\u01b0": ("sou desu", "seem"),
        "tro nen": ("you ni naru", "become"),
        "tr\u1edf n\u00ean": ("you ni naru", "become"),
        "khuyen": ("hou ga ii", "advice", "should"),
        "khuy\u00ean": ("hou ga ii", "advice", "should"),
        "uong": ("nomu", "drink"),
        "u\u1ed1ng": ("nomu", "drink"),
        "nhin": ("miru", "see"),
        "nh\u00ecn": ("miru", "see"),
        "xem": ("miru", "see"),
        "nghe": ("kiku", "listen"),
        "hoi": ("kiku", "ask"),
        "h\u1ecfi": ("kiku", "ask"),
        "bat dau": ("hajimeru", "start"),
        "b\u1eaft \u0111\u1ea7u": ("hajimeru", "start"),
        "ket thuc": ("owaru", "finish"),
        "k\u1ebft th\u00fac": ("owaru", "finish"),
        "met": ("tsukareru", "tired"),
        "m\u1ec7t": ("tsukareru", "tired"),
        "nha ga": ("eki", "station"),
        "nh\u00e0 ga": ("eki", "station"),
        "tau dien": ("densha", "electric train"),
        "t\u00e0u \u0111i\u1ec7n": ("densha", "electric train"),
        "hoc tieng nhat": ("nihongo", "benkyou", "tai"),
        "h\u1ecdc ti\u1ebfng nh\u1eadt": ("nihongo", "benkyou", "tai"),
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
        for phrase, expansion_terms in self._QUERY_EXPANSIONS.items():
            if self._contains_query_phrase(normalized, phrase):
                for expansion_term in expansion_terms:
                    self._add_term_with_kana_variant(terms, expansion_term)
        for part in normalized.split():
            if len(part) >= 2:
                self._add_term_with_kana_variant(terms, part)
        return terms

    def _contains_query_phrase(self, normalized: str, phrase: str) -> bool:
        if phrase.isascii():
            return phrase in normalized
        if len(phrase) == 1:
            return re.search(rf"(^|\s){re.escape(phrase)}($|\s)", normalized) is not None
        return phrase in normalized

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
