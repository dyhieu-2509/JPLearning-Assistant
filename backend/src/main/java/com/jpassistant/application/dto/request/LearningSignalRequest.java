package com.jpassistant.application.dto.request;

import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LearningSignalRequest(
        @NotBlank @Size(max = 50) String knowledgeType,
        @NotBlank @Size(max = 200) String knowledgeId,
        @Size(max = 200) String title,
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String level,
        @NotNull LearningSignalSource source,
        @NotNull LearningSignalResult result
) {
}
