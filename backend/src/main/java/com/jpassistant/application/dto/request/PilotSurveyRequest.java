package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PilotSurveyRequest(
        @NotBlank @Size(max = 50) String contextType,
        @Size(max = 200) String contextId,
        @Size(max = 200) String contextTitle,
        @NotNull @Size(min = 10, max = 10) List<@NotNull @Min(1) @Max(5) Integer> susScores,
        @Min(1) @Max(5) Integer trustRating,
        @Size(max = 500) String comment
) {
}
