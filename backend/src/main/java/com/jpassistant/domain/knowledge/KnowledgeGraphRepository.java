package com.jpassistant.domain.knowledge;

import java.util.List;

public interface KnowledgeGraphRepository {

    /**
     * Searches vocabulary nodes in the Knowledge Graph.
     *
     * @param query free-text query, or blank for all items in the level
     * @param level JLPT level such as N5 or N4
     * @param limit maximum number of items to return
     * @return matched vocabulary items
     */
    List<KnowledgeItem> searchVocabulary(String query, String level, int limit);

    /**
     * Searches grammar point nodes in the Knowledge Graph.
     *
     * @param query free-text query, or blank for all items in the level
     * @param level JLPT level such as N5 or N4
     * @param limit maximum number of items to return
     * @return matched grammar items
     */
    List<KnowledgeItem> searchGrammar(String query, String level, int limit);

    /**
     * Searches kanji nodes in the Knowledge Graph.
     *
     * @param query free-text query, or blank for all items in the level
     * @param level JLPT level such as N5 or N4
     * @param limit maximum number of items to return
     * @return matched kanji items
     */
    List<KnowledgeItem> searchKanji(String query, String level, int limit);
}
