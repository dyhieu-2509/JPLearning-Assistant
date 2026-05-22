package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChatMessageResponse(
        UUID id,
        UUID sessionId,
        String role,
        String content,
        List<SourceResponse> sources,
        Double confidence,
        Instant createdAt
) {
}
