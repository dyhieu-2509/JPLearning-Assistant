package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AssessmentSummaryResponse(
        UUID sessionId,
        String level,
        String category,
        int score,
        int total,
        List<String> weakAreas,
        Instant submittedAt
) {
}
