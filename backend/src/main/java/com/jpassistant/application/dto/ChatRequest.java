package com.jpassistant.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @NotBlank @Size(max = 2000) String message,
        String userId,
        String contextTopic
) {
}
