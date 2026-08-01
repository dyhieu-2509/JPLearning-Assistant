package com.jpassistant.application.dto.request;

import com.jpassistant.domain.personalization.StudyFeedbackMoment;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StudyFeedbackRequest(
        @NotNull StudyFeedbackMoment moment,
        @NotBlank @Size(max = 50) String contextType,
        @Size(max = 200) String contextId,
        @Size(max = 200) String contextTitle,
        @Min(1) @Max(5) Integer rating,
        @Min(1) @Max(5) Integer clarityRating,
        @Min(1) @Max(5) Integer trustRating,
        @Size(max = 30) String difficultyFit,
        @Size(max = 30) String paceChoice,
        @Size(max = 30) String actionChoice,
        @Size(max = 500) String comment
) {
}
