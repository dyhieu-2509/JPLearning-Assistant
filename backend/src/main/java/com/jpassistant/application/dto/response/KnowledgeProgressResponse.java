package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.UUID;

public record KnowledgeProgressResponse(
        UUID id,
        String userId,
        String knowledgeType,
        String knowledgeId,
        String title,
        String level,
        double masteryScore,
        int exposureCount,
        int correctCount,
        int wrongCount,
        Instant lastExposedAt,
        Instant lastReviewedAt,
        Instant nextReviewAt,
        Instant updatedAt
) {
}
