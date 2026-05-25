package com.jpassistant.application.dto.response;

public record StudyPlanItemResponse(
        int order,
        String title,
        String objective,
        double estimatedHours
) {
}
