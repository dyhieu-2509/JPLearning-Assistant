package com.jpassistant.application.dto.response;

import com.jpassistant.domain.personalization.StudyFeedbackMoment;
import java.time.Instant;
import java.util.UUID;

public record StudyFeedbackResponse(
        UUID id,
        String userId,
        StudyFeedbackMoment moment,
        String contextType,
        String contextId,
        String contextTitle,
        Integer rating,
        Integer clarityRating,
        Integer trustRating,
        String difficultyFit,
        String paceChoice,
        String actionChoice,
        String comment,
        Instant createdAt
) {
}
