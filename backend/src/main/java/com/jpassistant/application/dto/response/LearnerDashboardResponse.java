package com.jpassistant.application.dto.response;

import java.time.Instant;

public record LearnerDashboardResponse(
        StudentProfileResponse profile,
        DashboardProgressSummaryResponse progress,
        DashboardFlashcardSummaryResponse flashcards,
        DashboardAssessmentSummaryResponse assessments,
        DashboardChatSummaryResponse chat,
        Instant generatedAt
) {
}
