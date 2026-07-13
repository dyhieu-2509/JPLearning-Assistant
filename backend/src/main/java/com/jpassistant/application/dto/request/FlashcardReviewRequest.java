package com.jpassistant.application.dto.request;

import com.jpassistant.domain.personalization.LearningSignalResult;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record FlashcardReviewRequest(
        @Size(max = 50) String knowledgeType,
        @Size(max = 200) String knowledgeId,
        @Size(max = 200) String title,
        @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
        String level,
        @NotNull LearningSignalResult rating,
        UUID cardId
) {

    public FlashcardReviewRequest(
            @NotBlank @Size(max = 50) String knowledgeType,
            @NotBlank @Size(max = 200) String knowledgeId,
            @Size(max = 200) String title,
            @Pattern(regexp = "N[45]", message = "must be N5 or N4 for the MVP scope")
            String level,
            @NotNull LearningSignalResult rating
    ) {
        this(knowledgeType, knowledgeId, title, level, rating, null);
    }
}
