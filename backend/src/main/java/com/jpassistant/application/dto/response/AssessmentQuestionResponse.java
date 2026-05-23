package com.jpassistant.application.dto.response;

import java.util.List;

public record AssessmentQuestionResponse(
        String id,
        String prompt,
        List<String> options
) {
}
