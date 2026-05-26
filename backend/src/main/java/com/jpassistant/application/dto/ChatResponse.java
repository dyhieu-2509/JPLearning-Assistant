package com.jpassistant.application.dto;

import java.util.List;

public record ChatResponse(
        String answer,
        List<SourceResponse> sources,
        double confidence
) {
}
