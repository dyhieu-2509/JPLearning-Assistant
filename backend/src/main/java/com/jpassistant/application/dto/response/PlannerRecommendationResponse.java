package com.jpassistant.application.dto.response;

import java.util.List;
import java.util.UUID;

public record PlannerRecommendationResponse(
        UUID planId,
        String level,
        String targetLevel,
        String goal,
        int weeklyStudyHours,
        List<StudyPlanItemResponse> items,
        PlannerContextResponse context
) {
}
