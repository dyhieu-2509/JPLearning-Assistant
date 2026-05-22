package com.jpassistant.application.dto.response;

import java.util.List;

public record AiPlannerResponse(
        String level,
        String goal,
        List<StudyPlanItemResponse> items
) {
}
