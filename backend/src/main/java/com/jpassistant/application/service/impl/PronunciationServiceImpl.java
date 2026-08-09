package com.jpassistant.application.service.impl;

import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.response.AiPronunciationScoreResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.PronunciationScoreResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.application.service.PronunciationService;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import java.io.IOException;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PronunciationServiceImpl implements PronunciationService {

    private static final long MAX_AUDIO_BYTES = 20L * 1024L * 1024L;

    private final AiServiceClient aiServiceClient;
    private final PersonalizationService personalizationService;

    public PronunciationServiceImpl(
            AiServiceClient aiServiceClient,
            PersonalizationService personalizationService
    ) {
        this.aiServiceClient = aiServiceClient;
        this.personalizationService = personalizationService;
    }

    @Override
    public PronunciationScoreResponse scorePronunciation(
            String userId,
            MultipartFile audio,
            String targetText,
            String lessonId,
            String lessonTitle,
            String taskId,
            String taskTitle,
            String level
    ) {
        String normalizedUserId = requireText(userId, "authenticated user");
        String normalizedTarget = requireText(targetText, "targetText");
        String normalizedLessonId = requireText(lessonId, "lessonId");
        String normalizedTaskId = requireText(taskId, "taskId");
        String normalizedLevel = normalizeLevel(level);
        validateAudio(audio);

        AiPronunciationScoreResponse aiResponse = aiServiceClient.scorePronunciation(
                normalizedTarget,
                optionalText(lessonTitle),
                normalizedLevel,
                readBytes(audio),
                audio.getOriginalFilename(),
                parseMediaType(audio.getContentType())
        );
        KnowledgeProgressResponse progress = personalizationService.recordLearningSignal(
                normalizedUserId,
                new LearningSignalRequest(
                        "Pronunciation",
                        truncate(normalizedLessonId + ":" + normalizedTaskId, 200),
                        truncate(displayTitle(lessonTitle, taskTitle, normalizedTarget), 200),
                        normalizedLevel,
                        LearningSignalSource.EXPLICIT_FEEDBACK,
                        toLearningResult(aiResponse)
                )
        );

        return new PronunciationScoreResponse(
                optionalText(aiResponse.transcript()),
                clampScore(aiResponse.scorePercent()),
                normalizeVerdict(aiResponse.verdict(), aiResponse.scorePercent()),
                optionalText(aiResponse.feedback()),
                aiResponse.issues() == null ? List.of() : aiResponse.issues(),
                clampConfidence(aiResponse.confidence()),
                progress
        );
    }

    private void validateAudio(MultipartFile audio) {
        if (audio == null || audio.isEmpty()) {
            throw new InvalidRequestException("audio file is required");
        }
        if (audio.getSize() > MAX_AUDIO_BYTES) {
            throw new InvalidRequestException("audio file must be 20MB or smaller");
        }
    }

    private byte[] readBytes(MultipartFile audio) {
        try {
            return audio.getBytes();
        } catch (IOException ex) {
            throw new InvalidRequestException("could not read audio file");
        }
    }

    private MediaType parseMediaType(String value) {
        if (value == null || value.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(value);
        } catch (IllegalArgumentException ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private LearningSignalResult toLearningResult(AiPronunciationScoreResponse response) {
        return switch (normalizeVerdict(response.verdict(), response.scorePercent())) {
            case "GOOD" -> LearningSignalResult.GOOD;
            case "HARD" -> LearningSignalResult.HARD;
            default -> LearningSignalResult.AGAIN;
        };
    }

    private String normalizeVerdict(String value, int score) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        if (normalized.equals("GOOD") || normalized.equals("HARD") || normalized.equals("AGAIN")) {
            return normalized;
        }
        if (score >= 80) {
            return "GOOD";
        }
        if (score >= 60) {
            return "HARD";
        }
        return "AGAIN";
    }

    private int clampScore(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private double clampConfidence(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private String normalizeLevel(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        return "N4".equals(normalized) ? "N4" : "N5";
    }

    private String displayTitle(String lessonTitle, String taskTitle, String targetText) {
        String lesson = optionalText(lessonTitle);
        String task = optionalText(taskTitle);
        if (!lesson.isBlank() && !task.isBlank()) {
            return lesson + ": " + task;
        }
        if (!lesson.isBlank()) {
            return lesson;
        }
        if (!task.isBlank()) {
            return task;
        }
        return targetText;
    }

    private String requireText(String value, String fieldName) {
        String normalized = optionalText(value);
        if (normalized.isBlank()) {
            throw new InvalidRequestException(fieldName + " is required");
        }
        return normalized;
    }

    private String optionalText(String value) {
        return value == null ? "" : value.trim();
    }

    private String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }
}
