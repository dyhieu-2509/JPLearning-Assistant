package com.jpassistant.application.dto.response;

import java.util.List;

public record AiAssessmentGenerateResponse(
        List<AiAssessmentQuestionResponse> questions
) {
}
