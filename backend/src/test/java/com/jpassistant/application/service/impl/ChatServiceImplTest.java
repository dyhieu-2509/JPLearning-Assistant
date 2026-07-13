package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.request.AiAssessmentGenerateRequest;
import com.jpassistant.application.dto.request.AiPlannerRequest;
import com.jpassistant.application.dto.request.AiTutorChatRequest;
import com.jpassistant.application.dto.request.ChatRequest;
import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.KnowledgeReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.request.StudentProfileRequest;
import com.jpassistant.application.dto.response.AiAssessmentGenerateResponse;
import com.jpassistant.application.dto.response.AiPlannerResponse;
import com.jpassistant.application.dto.response.ChatResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.SourceResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.chat.ChatMessage;
import com.jpassistant.domain.chat.ChatMessageRole;
import com.jpassistant.domain.chat.ChatSession;
import com.jpassistant.infrastructure.persistence.jpa.ChatMessageJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.ChatSessionJpaRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class ChatServiceImplTest {

    private final ChatSessionJpaRepository sessionRepository = org.mockito.Mockito.mock(
            ChatSessionJpaRepository.class
    );
    private final ChatMessageJpaRepository messageRepository = org.mockito.Mockito.mock(
            ChatMessageJpaRepository.class
    );

    @Test
    void chatPersistsSessionMessagesAndRecordsSourceExposure() {
        RecordingAiServiceClient aiClient = new RecordingAiServiceClient();
        StubPersonalizationService personalizationService = new StubPersonalizationService();
        ChatServiceImpl service = new ChatServiceImpl(
                aiClient,
                personalizationService,
                sessionRepository,
                messageRepository,
                new ObjectMapper()
        );
        when(sessionRepository.save(any(ChatSession.class)))
                .thenAnswer(invocation -> withId(invocation.getArgument(0)));

        ChatResponse response = service.chat(
                " user-1 ",
                new ChatRequest("て form là gì?", null, "grammar")
        );

        assertThat(response.answer()).contains("て form");
        assertThat(response.sessionId()).isNotNull();
        assertThat(aiClient.lastRequest.userId()).isEqualTo("user-1");
        assertThat(aiClient.lastRequest.profile()).isNotNull();
        assertThat(aiClient.lastRequest.profile().currentLevel()).isEqualTo("N5");
        assertThat(aiClient.lastRequest.weakProgress()).hasSize(1);
        assertThat(personalizationService.exposures).hasSize(1);
        assertThat(personalizationService.exposures.get(0).knowledgeType()).isEqualTo("GrammarPoint");
        assertThat(personalizationService.exposures.get(0).knowledgeId()).isEqualTo("te-form:N5");

        ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(messageRepository, times(2)).save(messageCaptor.capture());
        assertThat(messageCaptor.getAllValues()).extracting(ChatMessage::getRole)
                .containsExactly(ChatMessageRole.USER, ChatMessageRole.ASSISTANT);
        assertThat(messageCaptor.getAllValues().get(1).getSourcesJson()).contains("te-form:N5");
    }

    @Test
    void chatRequiresAuthenticatedUser() {
        ChatServiceImpl service = new ChatServiceImpl(
                new RecordingAiServiceClient(),
                new StubPersonalizationService(),
                sessionRepository,
                messageRepository,
                new ObjectMapper()
        );

        assertThatThrownBy(() -> service.chat(" ", new ChatRequest("taberu là gì?", null, null)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("authenticated user is required");
    }

    private ChatSession withId(ChatSession session) {
        if (session.getId() == null) {
            ReflectionTestUtils.setField(session, "id", UUID.randomUUID());
        }
        return session;
    }

    private static class RecordingAiServiceClient implements AiServiceClient {

        private AiTutorChatRequest lastRequest;

        @Override
        public ChatResponse chat(AiTutorChatRequest request) {
            this.lastRequest = request;
            return new ChatResponse(
                    request.message() + " là dạng nối của động từ.",
                    List.of(new SourceResponse("GrammarPoint", "te-form:N5", "te form")),
                    0.7
            );
        }

        @Override
        public AiAssessmentGenerateResponse generateAssessment(AiAssessmentGenerateRequest request) {
            throw new UnsupportedOperationException();
        }

        @Override
        public AiPlannerResponse recommendPlan(AiPlannerRequest request) {
            throw new UnsupportedOperationException();
        }
    }

    private static class StubPersonalizationService implements PersonalizationService {

        private final List<KnowledgeProgressRequest> exposures = new ArrayList<>();

        @Override
        public StudentProfileResponse getOrCreateProfile(String userId) {
            return new StudentProfileResponse(
                    UUID.randomUUID(),
                    userId,
                    "N5",
                    "N4",
                    "https://cdn.example.com/avatar.png",
                    "JLPT N4",
                    "jlpt_foundation",
                    45,
                    "detailed",
                    false,
                    List.of("particles"),
                    Instant.now(),
                    Instant.now()
            );
        }

        @Override
        public StudentProfileResponse updateProfile(String userId, StudentProfileRequest request) {
            throw new UnsupportedOperationException();
        }

        @Override
        public List<KnowledgeProgressResponse> getProgress(String userId, boolean weakOnly, Integer limit) {
            return List.of(new KnowledgeProgressResponse(
                    UUID.randomUUID(),
                    userId,
                    "Vocabulary",
                    "tabemasu:N5",
                    "食べます",
                    "N5",
                    0.2,
                    3,
                    1,
                    2,
                    Instant.now(),
                    Instant.now(),
                    Instant.now(),
                    Instant.now()
            ));
        }

        @Override
        public KnowledgeProgressResponse recordExposure(String userId, KnowledgeProgressRequest request) {
            exposures.add(request);
            return null;
        }

        @Override
        public KnowledgeProgressResponse recordReview(String userId, KnowledgeReviewRequest request) {
            throw new UnsupportedOperationException();
        }

        @Override
        public KnowledgeProgressResponse recordLearningSignal(String userId, LearningSignalRequest request) {
            throw new UnsupportedOperationException();
        }
    }
}
