package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StudentProfileRequest(
        @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
        String currentLevel,
        @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
        String targetLevel,
        @Size(max = 500) String avatarUrl,
        @Size(max = 200) String goal,
        @Pattern(
                regexp = "jlpt_foundation|conversation|school|work|reading",
                message = "must be jlpt_foundation, conversation, school, work, or reading"
        )
        String learningPathway,
        @Min(5) @Max(480) Integer dailyStudyMinutes,
        @Size(max = 50) String explanationStyle,
        Boolean romajiEnabled,
        @Size(max = 10) List<@Size(max = 50) String> weakSkills
) {
}
