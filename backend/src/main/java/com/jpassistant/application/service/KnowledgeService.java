package com.jpassistant.application.service;

import com.jpassistant.application.dto.response.KnowledgeItemResponse;
import java.util.List;

public interface KnowledgeService {

    /**
     * Searches vocabulary items.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit requested result limit
     * @return vocabulary response DTOs
     */
    List<KnowledgeItemResponse> searchVocabulary(String query, String level, Integer limit);

    /**
     * Searches grammar points.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit requested result limit
     * @return grammar response DTOs
     */
    List<KnowledgeItemResponse> searchGrammar(String query, String level, Integer limit);

    /**
     * Searches kanji items.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit requested result limit
     * @return kanji response DTOs
     */
    List<KnowledgeItemResponse> searchKanji(String query, String level, Integer limit);
}
