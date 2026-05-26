package com.jpassistant.application.dto.response;

import java.util.List;

public record DashboardFlashcardSummaryResponse(
        long totalCards,
        long dueCards,
        List<FlashcardCardResponse> dueNow
) {
}
