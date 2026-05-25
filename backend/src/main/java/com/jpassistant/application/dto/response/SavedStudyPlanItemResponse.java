package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.UUID;

public record SavedStudyPlanItemResponse(
        UUID id,
        int order,
        String title,
        String objective,
        double estimatedHours,
        boolean completed,
        Instant completedAt
) {
}
