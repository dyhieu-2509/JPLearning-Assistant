package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ChatSessionResponse(
        UUID id,
        String userId,
        String title,
        String contextTopic,
        Instant startedAt,
        Instant updatedAt
) {
}
