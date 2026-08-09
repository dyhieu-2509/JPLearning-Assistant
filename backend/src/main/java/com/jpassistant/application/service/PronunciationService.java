package com.jpassistant.application.service;

import com.jpassistant.application.dto.response.PronunciationScoreResponse;
import org.springframework.web.multipart.MultipartFile;

public interface PronunciationService {

    PronunciationScoreResponse scorePronunciation(
            String userId,
            MultipartFile audio,
            String targetText,
            String lessonId,
            String lessonTitle,
            String taskId,
            String taskTitle,
            String level
    );
}
