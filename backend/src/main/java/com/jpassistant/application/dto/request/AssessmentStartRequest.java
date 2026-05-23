package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AssessmentStartRequest(
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String level,
        @Size(max = 50) String category,
        @Min(1) @Max(20) Integer questionCount
) {
}
