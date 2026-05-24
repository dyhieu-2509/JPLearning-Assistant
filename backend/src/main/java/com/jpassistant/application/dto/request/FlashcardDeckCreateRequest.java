package com.jpassistant.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record FlashcardDeckCreateRequest(
        @Size(max = 200) String title,
        @Pattern(regexp = "N[1-5]", message = "must be one of N1, N2, N3, N4, N5")
        String level,
        @Pattern(regexp = "[a-zA-Z0-9_-]{1,50}", message = "must contain only letters, numbers, underscore, or hyphen")
        String category,
        Boolean autoGenerate,
        Integer limit,
        List<@Valid FlashcardCardCreateRequest> cards
) {
}
