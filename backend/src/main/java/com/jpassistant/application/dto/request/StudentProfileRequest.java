package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StudentProfileRequest(
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String currentLevel,
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String targetLevel,
        @Size(max = 500) String avatarUrl,
        @Size(max = 200) String goal,
        @Min(5) @Max(480) Integer dailyStudyMinutes,
        @Size(max = 50) String explanationStyle,
        Boolean romajiEnabled,
        @Size(max = 10) List<@Size(max = 50) String> weakSkills
) {
}
