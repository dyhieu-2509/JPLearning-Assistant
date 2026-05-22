package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ChatRequest(
        @NotBlank @Size(max = 2000) String message,
        String userId,
        String contextTopic,
        UUID sessionId
) {

    public ChatRequest(String message, String userId, String contextTopic) {
        this(message, userId, contextTopic, null);
    }
}
