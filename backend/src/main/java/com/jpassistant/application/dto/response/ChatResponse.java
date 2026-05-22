package com.jpassistant.application.dto.response;

import java.util.List;
import java.util.UUID;

public record ChatResponse(
        String answer,
        List<SourceResponse> sources,
        double confidence,
        UUID sessionId
) {

    public ChatResponse(String answer, List<SourceResponse> sources, double confidence) {
        this(answer, sources, confidence, null);
    }
}
