package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.UUID;

public record FlashcardDeckResponse(
        UUID id,
        String title,
        String level,
        String category,
        long cardCount,
        Instant createdAt,
        Instant updatedAt
) {
}
