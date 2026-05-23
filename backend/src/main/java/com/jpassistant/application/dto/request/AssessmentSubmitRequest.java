package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record AssessmentSubmitRequest(
        @NotNull Map<String, String> answers
) {
}
