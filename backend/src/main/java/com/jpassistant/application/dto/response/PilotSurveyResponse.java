package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PilotSurveyResponse(
        UUID id,
        String userId,
        String contextType,
        String contextId,
        String contextTitle,
        List<Integer> susScores,
        double susScore,
        Integer trustRating,
        String comment,
        Instant createdAt
) {
}
