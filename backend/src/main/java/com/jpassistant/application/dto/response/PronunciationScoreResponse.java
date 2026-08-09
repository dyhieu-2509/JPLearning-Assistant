package com.jpassistant.application.dto.response;

import java.util.List;

public record PronunciationScoreResponse(
        String transcript,
        int scorePercent,
        String verdict,
        String feedback,
        List<String> issues,
        double confidence,
        KnowledgeProgressResponse progress
) {
}
