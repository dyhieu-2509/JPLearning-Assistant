package com.jpassistant.application.dto.response;

import java.util.List;

public record AiPronunciationScoreResponse(
        String transcript,
        int scorePercent,
        String verdict,
        String feedback,
        List<String> issues,
        double confidence
) {
}
