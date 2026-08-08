package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudyLessonAttemptStartRequest(
        @NotBlank @Size(max = 100) String lessonId,
        @Size(max = 200) String lessonTitle,
        @Size(max = 10) String level,
        @Size(max = 100) String chapterId,
        @Size(max = 200) String chapterTitle
) {
}
