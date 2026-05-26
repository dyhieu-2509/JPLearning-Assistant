package com.jpassistant.application.dto.response;

import java.util.List;

public record DashboardAssessmentSummaryResponse(
        long completedSessions,
        double averageScorePercent,
        AssessmentSummaryResponse latest,
        List<String> recentWeakAreas
) {
}
