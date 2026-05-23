package com.jpassistant.application.dto.response;

import java.util.List;
import java.util.UUID;

public record AssessmentStartResponse(
        UUID sessionId,
        String level,
        String category,
        List<AssessmentQuestionResponse> questions
) {
}
