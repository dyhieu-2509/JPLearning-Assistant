package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FlashcardCardCreateRequest(
        @Size(max = 500) String frontText,
        @Size(max = 1000) String backText,
        @Size(max = 500) String reading,
        @Size(max = 50) String sourceType,
        @Size(max = 200) String sourceId,
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String level
) {
}
