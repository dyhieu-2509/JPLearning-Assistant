package com.jpassistant.application.service;

import com.jpassistant.application.dto.KnowledgeItemResponse;
import com.jpassistant.domain.knowledge.KnowledgeGraphRepository;
import com.jpassistant.domain.knowledge.KnowledgeItem;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeServiceImpl implements KnowledgeService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final KnowledgeGraphRepository repository;

    /**
     * Creates the knowledge application service.
     *
     * @param repository Knowledge Graph repository port
     */
    public KnowledgeServiceImpl(KnowledgeGraphRepository repository) {
        this.repository = repository;
    }

    /**
     * Searches vocabulary items.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit requested result limit
     * @return vocabulary response DTOs
     */
    @Override
    public List<KnowledgeItemResponse> searchVocabulary(String query, String level, Integer limit) {
        return repository.searchVocabulary(normalizeQuery(query), normalizeLevel(level), normalizeLimit(limit))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Searches grammar points.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit requested result limit
     * @return grammar response DTOs
     */
    @Override
    public List<KnowledgeItemResponse> searchGrammar(String query, String level, Integer limit) {
        return repository.searchGrammar(normalizeQuery(query), normalizeLevel(level), normalizeLimit(limit))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Searches kanji items.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit requested result limit
     * @return kanji response DTOs
     */
    @Override
    public List<KnowledgeItemResponse> searchKanji(String query, String level, Integer limit) {
        return repository.searchKanji(normalizeQuery(query), normalizeLevel(level), normalizeLimit(limit))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private String normalizeQuery(String query) {
        return query == null ? "" : query.trim();
    }

    private String normalizeLevel(String level) {
        String normalized = level == null || level.isBlank() ? "N5" : level.trim().toUpperCase();
        if (!normalized.matches("N[1-5]")) {
            throw new InvalidRequestException("level must be one of N1, N2, N3, N4, N5");
        }
        return normalized;
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        return Math.min(Math.max(limit, 1), MAX_LIMIT);
    }

    private KnowledgeItemResponse toResponse(KnowledgeItem item) {
        return new KnowledgeItemResponse(
                item.type(),
                item.id(),
                item.title(),
                item.reading(),
                item.meaningVi(),
                item.meaningEn(),
                item.level(),
                item.source()
        );
    }
}
