package com.jpassistant.application.dto.response;

import java.util.List;

public record AiAssessmentQuestionResponse(
        String id,
        String prompt,
        List<String> options,
        String answer,
        String explanation
) {
}
