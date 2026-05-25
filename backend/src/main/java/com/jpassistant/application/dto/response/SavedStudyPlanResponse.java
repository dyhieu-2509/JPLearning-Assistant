package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SavedStudyPlanResponse(
        UUID id,
        String level,
        String targetLevel,
        String goal,
        int weeklyStudyHours,
        long completedItems,
        int totalItems,
        double completionRate,
        List<SavedStudyPlanItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
