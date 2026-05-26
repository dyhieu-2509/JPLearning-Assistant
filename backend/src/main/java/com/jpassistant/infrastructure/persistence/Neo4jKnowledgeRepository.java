package com.jpassistant.infrastructure.persistence;

import com.jpassistant.domain.knowledge.KnowledgeGraphRepository;
import com.jpassistant.domain.knowledge.KnowledgeItem;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.neo4j.driver.Record;
import org.neo4j.driver.Value;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

@Repository
public class Neo4jKnowledgeRepository implements KnowledgeGraphRepository {

    private static final String VOCABULARY_QUERY = """
            WITH [term IN $terms WHERE term <> ''] AS terms
            MATCH (v:Vocabulary)
            WITH v, terms,
                 toLower(coalesce(v.kanji, '') + ' ' + coalesce(v.reading, '') + ' '
                     + coalesce(v.romaji, '') + ' ' + coalesce(v.meaning_vi, '') + ' '
                     + coalesce(v.meaning_en, '')) AS searchable
            WHERE ($level = '' OR v.level = $level)
              AND (size(terms) = 0 OR any(term IN terms WHERE searchable CONTAINS term))
            WITH v,
                 CASE WHEN coalesce(v.meaning_vi, '') <> '' OR coalesce(v.meaning_en, '') <> '' THEN 0 ELSE 1 END AS meaningRank
            RETURN 'Vocabulary' AS type,
                   coalesce(v.reading, elementId(v)) + ':' + coalesce(v.level, '') AS id,
                   coalesce(v.kanji, v.reading, '') AS title,
                   coalesce(v.reading, '') AS reading,
                   coalesce(v.meaning_vi, '') AS meaningVi,
                   coalesce(v.meaning_en, '') AS meaningEn,
                   coalesce(v.level, '') AS level,
                   coalesce(v.source, 'JLPT') AS source
            ORDER BY meaningRank, title
            LIMIT $limit
            """;

    private static final String GRAMMAR_QUERY = """
            WITH [term IN $terms WHERE term <> ''] AS terms
            MATCH (g:GrammarPoint)
            WITH g, terms,
                 toLower(coalesce(g.pattern, '') + ' '
                     + coalesce(g.meaning_vi, '') + ' ' + coalesce(g.meaning_en, '')) AS searchable
            WHERE ($level = '' OR g.level = $level)
              AND (size(terms) = 0 OR any(term IN terms WHERE searchable CONTAINS term))
            RETURN 'GrammarPoint' AS type,
                   coalesce(g.pattern, elementId(g)) + ':' + coalesce(g.level, '') AS id,
                   coalesce(g.pattern, '') AS title,
                   '' AS reading,
                   coalesce(g.meaning_vi, '') AS meaningVi,
                   coalesce(g.meaning_en, '') AS meaningEn,
                   coalesce(g.level, '') AS level,
                   coalesce(g.source, 'JLPT') AS source
            ORDER BY title
            LIMIT $limit
            """;

    private static final String KANJI_QUERY = """
            WITH [term IN $terms WHERE term <> ''] AS terms
            MATCH (k:Kanji)
            WITH k, terms,
                 toLower(coalesce(k.character, '') + ' ' + coalesce(k.meaning_vi, '') + ' '
                     + coalesce(k.meaning_en, '')) AS searchable
            WHERE ($level = '' OR k.level = $level)
              AND (size(terms) = 0 OR any(term IN terms WHERE searchable CONTAINS term))
            RETURN 'Kanji' AS type,
                   coalesce(k.character, elementId(k)) AS id,
                   coalesce(k.character, '') AS title,
                   '' AS reading,
                   coalesce(k.meaning_vi, '') AS meaningVi,
                   coalesce(k.meaning_en, '') AS meaningEn,
                   coalesce(k.level, '') AS level,
                   coalesce(k.source, 'JLPT') AS source
            ORDER BY title
            LIMIT $limit
            """;

    private static final Map<String, String> ROMAJI_TO_HIRAGANA = Map.ofEntries(
            Map.entry("kya", "きゃ"), Map.entry("kyu", "きゅ"), Map.entry("kyo", "きょ"),
            Map.entry("sha", "しゃ"), Map.entry("shu", "しゅ"), Map.entry("sho", "しょ"),
            Map.entry("cha", "ちゃ"), Map.entry("chu", "ちゅ"), Map.entry("cho", "ちょ"),
            Map.entry("nya", "にゃ"), Map.entry("nyu", "にゅ"), Map.entry("nyo", "にょ"),
            Map.entry("hya", "ひゃ"), Map.entry("hyu", "ひゅ"), Map.entry("hyo", "ひょ"),
            Map.entry("mya", "みゃ"), Map.entry("myu", "みゅ"), Map.entry("myo", "みょ"),
            Map.entry("rya", "りゃ"), Map.entry("ryu", "りゅ"), Map.entry("ryo", "りょ"),
            Map.entry("gya", "ぎゃ"), Map.entry("gyu", "ぎゅ"), Map.entry("gyo", "ぎょ"),
            Map.entry("ja", "じゃ"), Map.entry("ju", "じゅ"), Map.entry("jo", "じょ"),
            Map.entry("bya", "びゃ"), Map.entry("byu", "びゅ"), Map.entry("byo", "びょ"),
            Map.entry("pya", "ぴゃ"), Map.entry("pyu", "ぴゅ"), Map.entry("pyo", "ぴょ"),
            Map.entry("shi", "し"), Map.entry("chi", "ち"), Map.entry("tsu", "つ"),
            Map.entry("fu", "ふ"), Map.entry("ji", "じ"),
            Map.entry("ka", "か"), Map.entry("ki", "き"), Map.entry("ku", "く"),
            Map.entry("ke", "け"), Map.entry("ko", "こ"),
            Map.entry("sa", "さ"), Map.entry("su", "す"), Map.entry("se", "せ"),
            Map.entry("so", "そ"), Map.entry("ta", "た"), Map.entry("te", "て"),
            Map.entry("to", "と"), Map.entry("na", "な"), Map.entry("ni", "に"),
            Map.entry("nu", "ぬ"), Map.entry("ne", "ね"), Map.entry("no", "の"),
            Map.entry("ha", "は"), Map.entry("hi", "ひ"), Map.entry("he", "へ"),
            Map.entry("ho", "ほ"), Map.entry("ma", "ま"), Map.entry("mi", "み"),
            Map.entry("mu", "む"), Map.entry("me", "め"), Map.entry("mo", "も"),
            Map.entry("ya", "や"), Map.entry("yu", "ゆ"), Map.entry("yo", "よ"),
            Map.entry("ra", "ら"), Map.entry("ri", "り"), Map.entry("ru", "る"),
            Map.entry("re", "れ"), Map.entry("ro", "ろ"), Map.entry("wa", "わ"),
            Map.entry("wo", "を"), Map.entry("ga", "が"), Map.entry("gi", "ぎ"),
            Map.entry("gu", "ぐ"), Map.entry("ge", "げ"), Map.entry("go", "ご"),
            Map.entry("za", "ざ"), Map.entry("zu", "ず"), Map.entry("ze", "ぜ"),
            Map.entry("zo", "ぞ"), Map.entry("da", "だ"), Map.entry("de", "で"),
            Map.entry("do", "ど"), Map.entry("ba", "ば"), Map.entry("bi", "び"),
            Map.entry("bu", "ぶ"), Map.entry("be", "べ"), Map.entry("bo", "ぼ"),
            Map.entry("pa", "ぱ"), Map.entry("pi", "ぴ"), Map.entry("pu", "ぷ"),
            Map.entry("pe", "ぺ"), Map.entry("po", "ぽ"), Map.entry("a", "あ"),
            Map.entry("i", "い"), Map.entry("u", "う"), Map.entry("e", "え"),
            Map.entry("o", "お"), Map.entry("n", "ん")
    );

    private final Neo4jClient neo4jClient;

    /**
     * Creates a Neo4j-backed repository adapter.
     *
     * @param neo4jClient Spring Data Neo4j client
     */
    public Neo4jKnowledgeRepository(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    /**
     * Searches vocabulary nodes in the Knowledge Graph.
     *
     * @param query free-text query, or blank for all items in the level
     * @param level JLPT level such as N5 or N4
     * @param limit maximum number of items to return
     * @return matched vocabulary items
     */
    @Override
    public List<KnowledgeItem> searchVocabulary(String query, String level, int limit) {
        return fetch(VOCABULARY_QUERY, query, level, limit);
    }

    /**
     * Searches grammar point nodes in the Knowledge Graph.
     *
     * @param query free-text query, or blank for all items in the level
     * @param level JLPT level such as N5 or N4
     * @param limit maximum number of items to return
     * @return matched grammar items
     */
    @Override
    public List<KnowledgeItem> searchGrammar(String query, String level, int limit) {
        return fetch(GRAMMAR_QUERY, query, level, limit);
    }

    /**
     * Searches kanji nodes in the Knowledge Graph.
     *
     * @param query free-text query, or blank for all items in the level
     * @param level JLPT level such as N5 or N4
     * @param limit maximum number of items to return
     * @return matched kanji items
     */
    @Override
    public List<KnowledgeItem> searchKanji(String query, String level, int limit) {
        return fetch(KANJI_QUERY, query, level, limit);
    }

    private List<KnowledgeItem> fetch(String cypher, String query, String level, int limit) {
        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(buildSearchTerms(query)).to("terms")
                .bind(level).to("level")
                .bind(limit).to("limit")
                .fetchAs(KnowledgeItem.class)
                .mappedBy((typeSystem, record) -> mapRecord(record))
                .all());
    }

    private KnowledgeItem mapRecord(Record record) {
        return new KnowledgeItem(
                stringValue(record, "type"),
                stringValue(record, "id"),
                stringValue(record, "title"),
                stringValue(record, "reading"),
                stringValue(record, "meaningVi"),
                stringValue(record, "meaningEn"),
                stringValue(record, "level"),
                stringValue(record, "source")
        );
    }

    private String stringValue(Record record, String key) {
        Value value = record.get(key);
        return value == null || value.isNull() ? "" : value.asString("");
    }

    private List<String> buildSearchTerms(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        Set<String> terms = new LinkedHashSet<>();
        String normalized = query.trim().toLowerCase(Locale.ROOT);
        addTermWithKanaVariant(terms, normalized);

        for (String part : normalized.split("\\s+")) {
            if (part.length() >= 2) {
                addTermWithKanaVariant(terms, part);
            }
        }

        return List.copyOf(terms);
    }

    private void addTermWithKanaVariant(Set<String> terms, String term) {
        terms.add(term);
        String hiragana = romajiToHiragana(term);
        if (!hiragana.equals(term)) {
            terms.add(hiragana);
        }
        addPoliteVerbVariants(terms, term);
        addPoliteVerbVariants(terms, hiragana);
    }

    private void addPoliteVerbVariants(Set<String> terms, String term) {
        if (term.endsWith("ru") && term.length() > 2 && term.matches("[a-z\\- ]+")) {
            addTermWithKanaVariantWithoutPoliteRecursion(terms, term.substring(0, term.length() - 2) + "masu");
        }
        if (term.endsWith("る") && term.length() > 1) {
            terms.add(term.substring(0, term.length() - 1) + "ます");
        }
    }

    private void addTermWithKanaVariantWithoutPoliteRecursion(Set<String> terms, String term) {
        terms.add(term);
        String hiragana = romajiToHiragana(term);
        if (!hiragana.equals(term)) {
            terms.add(hiragana);
        }
    }

    private String romajiToHiragana(String input) {
        if (!input.matches("[a-z\\- ]+")) {
            return input;
        }

        String text = input.replace("-", "");
        StringBuilder output = new StringBuilder();
        int index = 0;
        while (index < text.length()) {
            char current = text.charAt(index);
            if (current == ' ') {
                output.append(' ');
                index++;
                continue;
            }

            if (isDoubleConsonant(text, index)) {
                output.append('っ');
                index++;
                continue;
            }

            String matched = null;
            for (int length = 3; length >= 1; length--) {
                int end = index + length;
                if (end <= text.length()) {
                    String candidate = text.substring(index, end);
                    if (ROMAJI_TO_HIRAGANA.containsKey(candidate)) {
                        matched = candidate;
                        break;
                    }
                }
            }

            if (matched == null) {
                return input;
            }

            output.append(ROMAJI_TO_HIRAGANA.get(matched));
            index += matched.length();
        }

        return output.toString();
    }

    private boolean isDoubleConsonant(String text, int index) {
        if (index + 1 >= text.length()) {
            return false;
        }
        char current = text.charAt(index);
        return current == text.charAt(index + 1)
                && "bcdfghjklmpqrstvwxyz".indexOf(current) >= 0
                && current != 'n';
    }
}
