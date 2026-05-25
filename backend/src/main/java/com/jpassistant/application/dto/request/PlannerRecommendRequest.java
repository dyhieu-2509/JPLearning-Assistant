package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PlannerRecommendRequest(
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String currentLevel,
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String targetLevel,
        Integer weeklyStudyHours,
        @Size(max = 200) String goal
) {
}
