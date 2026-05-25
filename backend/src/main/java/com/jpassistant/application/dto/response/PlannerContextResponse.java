package com.jpassistant.application.dto.response;

import java.util.List;

public record PlannerContextResponse(
        StudentProfileResponse profile,
        List<KnowledgeProgressResponse> weakProgress,
        List<FlashcardCardResponse> dueFlashcards,
        List<String> recentChatTopics,
        AssessmentSummaryResponse recentAssessment
) {
}
