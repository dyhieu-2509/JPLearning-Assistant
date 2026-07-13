package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PlannerRecommendRequest(
        @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
        String currentLevel,
        @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
        String targetLevel,
        Integer weeklyStudyHours,
        @Size(max = 200) String goal,
        @Pattern(
                regexp = "jlpt_foundation|conversation|school|work|reading",
                message = "must be jlpt_foundation, conversation, school, work, or reading"
        )
        String learningPathway
) {
}
