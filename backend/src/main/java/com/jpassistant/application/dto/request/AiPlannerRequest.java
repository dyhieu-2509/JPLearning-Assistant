package com.jpassistant.application.dto.request;

public record AiPlannerRequest(
        String currentLevel,
        String targetLevel,
        int weeklyStudyHours,
        String goal
) {
}
