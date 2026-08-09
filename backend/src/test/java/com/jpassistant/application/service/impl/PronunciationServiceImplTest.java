package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.response.AiPronunciationScoreResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.MediaType;

class PronunciationServiceImplTest {

    private final AiServiceClient aiServiceClient = mock(AiServiceClient.class);
    private final PersonalizationService personalizationService = mock(PersonalizationService.class);
    private final PronunciationServiceImpl service = new PronunciationServiceImpl(
            aiServiceClient,
            personalizationService
    );

    @Test
    void scorePronunciationCallsAiAndRecordsProgressSignal() {
        MockMultipartFile audio = new MockMultipartFile(
                "audio",
                "sample.webm",
                "audio/webm",
                new byte[] {1, 2, 3}
        );
        when(aiServiceClient.scorePronunciation(
                eq("はじめまして。"),
                eq("Chào hỏi"),
                eq("N5"),
                any(byte[].class),
                eq("sample.webm"),
                eq(MediaType.parseMediaType("audio/webm"))
        )).thenReturn(new AiPronunciationScoreResponse(
                "はじめまして。",
                72,
                "HARD",
                "Gần đúng rồi, đọc chậm hơn một chút.",
                List.of("Âm cuối hơi nhỏ"),
                0.74
        ));
        when(personalizationService.recordLearningSignal(eq("user-1"), any()))
                .thenReturn(progressResponse());

        var response = service.scorePronunciation(
                "user-1",
                audio,
                "はじめまして。",
                "conversation-greetings",
                "Chào hỏi",
                "conversation-greetings-practice",
                "Đóng vai hội thoại",
                "N5"
        );

        assertThat(response.scorePercent()).isEqualTo(72);
        assertThat(response.verdict()).isEqualTo("HARD");
        assertThat(response.transcript()).isEqualTo("はじめまして。");
        assertThat(response.progress()).isNotNull();

        ArgumentCaptor<LearningSignalRequest> requestCaptor = ArgumentCaptor.forClass(LearningSignalRequest.class);
        verify(personalizationService).recordLearningSignal(eq("user-1"), requestCaptor.capture());
        LearningSignalRequest signal = requestCaptor.getValue();
        assertThat(signal.knowledgeType()).isEqualTo("Pronunciation");
        assertThat(signal.knowledgeId()).isEqualTo("conversation-greetings:conversation-greetings-practice");
        assertThat(signal.source()).isEqualTo(LearningSignalSource.EXPLICIT_FEEDBACK);
        assertThat(signal.result()).isEqualTo(LearningSignalResult.HARD);
    }

    @Test
    void scorePronunciationRejectsEmptyAudio() {
        MockMultipartFile audio = new MockMultipartFile("audio", "empty.webm", "audio/webm", new byte[0]);

        assertThatThrownBy(() -> service.scorePronunciation(
                "user-1",
                audio,
                "はじめまして。",
                "lesson-1",
                "Lesson",
                "task-1",
                "Task",
                "N5"
        ))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("audio file is required");
    }

    private KnowledgeProgressResponse progressResponse() {
        Instant now = Instant.now();
        return new KnowledgeProgressResponse(
                UUID.randomUUID(),
                "user-1",
                "Pronunciation",
                "conversation-greetings:conversation-greetings-practice",
                "Chào hỏi: Đóng vai hội thoại",
                "N5",
                0.44,
                0,
                1,
                0,
                null,
                now,
                now,
                now
        );
    }
}
