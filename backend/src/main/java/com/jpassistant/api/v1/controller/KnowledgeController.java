package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.response.KnowledgeItemResponse;
import com.jpassistant.application.service.KnowledgeService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    /**
     * Creates the knowledge API controller.
     *
     * @param knowledgeService knowledge application service
     */
    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    /**
     * Searches vocabulary items.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit maximum result count
     * @return matched vocabulary items
     */
    @GetMapping("/vocabulary")
    public List<KnowledgeItemResponse> vocabulary(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "N5") String level,
            @RequestParam(defaultValue = "20") Integer limit
    ) {
        return knowledgeService.searchVocabulary(query, level, limit);
    }

    /**
     * Searches grammar points.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit maximum result count
     * @return matched grammar points
     */
    @GetMapping("/grammar")
    public List<KnowledgeItemResponse> grammar(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "N5") String level,
            @RequestParam(defaultValue = "20") Integer limit
    ) {
        return knowledgeService.searchGrammar(query, level, limit);
    }

    /**
     * Searches kanji items.
     *
     * @param query free-text query
     * @param level JLPT level
     * @param limit maximum result count
     * @return matched kanji items
     */
    @GetMapping("/kanji")
    public List<KnowledgeItemResponse> kanji(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "N5") String level,
            @RequestParam(defaultValue = "20") Integer limit
    ) {
        return knowledgeService.searchKanji(query, level, limit);
    }
}
