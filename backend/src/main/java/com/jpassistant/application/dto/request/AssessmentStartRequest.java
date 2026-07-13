package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AssessmentStartRequest(
        @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
        String level,
        @Size(max = 50) String category,
        @Min(1) @Max(20) Integer questionCount
) {
}
