package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record KnowledgeProgressRequest(
        @NotBlank @Size(max = 50) String knowledgeType,
        @NotBlank @Size(max = 200) String knowledgeId,
        @Size(max = 200) String title,
        @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
        String level
) {
}
