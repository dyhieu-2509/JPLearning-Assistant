package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StudyLessonAttemptCompleteRequest(
        @NotNull @Min(0) @Max(100) Integer scorePercent,
        @NotNull @Min(0) Integer correctCount,
        @NotNull @Min(1) Integer totalQuestions,
        @NotNull Boolean passed
) {
}
