package com.jpassistant.application.dto.request;

public record AiAssessmentGenerateRequest(
        String level,
        String category,
        Integer questionCount
) {
}
