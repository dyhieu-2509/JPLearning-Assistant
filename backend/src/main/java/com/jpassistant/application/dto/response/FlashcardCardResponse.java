package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.UUID;

public record FlashcardCardResponse(
        UUID id,
        UUID deckId,
        String frontText,
        String backText,
        String reading,
        String sourceType,
        String sourceId,
        String level,
        double easinessFactor,
        int intervalDays,
        int repetitions,
        Instant nextReviewAt,
        Instant lastReviewedAt
) {
}
