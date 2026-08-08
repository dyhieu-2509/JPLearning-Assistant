package com.jpassistant.application.dto.response;

import com.jpassistant.domain.personalization.StudyLessonAttemptStatus;
import java.time.Instant;
import java.util.UUID;

public record StudyLessonAttemptResponse(
        UUID id,
        String userId,
        String lessonId,
        String lessonTitle,
        String level,
        String chapterId,
        String chapterTitle,
        StudyLessonAttemptStatus status,
        Integer scorePercent,
        Integer correctCount,
        Integer totalQuestions,
        Boolean passed,
        Long durationSeconds,
        Instant startedAt,
        Instant submittedAt,
        Instant updatedAt
) {
}
