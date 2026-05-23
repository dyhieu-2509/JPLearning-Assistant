package com.jpassistant.application.dto.response;

import java.util.List;
import java.util.UUID;

public record AssessmentSubmitResponse(
        UUID sessionId,
        int score,
        int total,
        List<String> weakAreas,
        List<AssessmentQuestionResultResponse> results,
        List<KnowledgeProgressResponse> progress
) {
}
