package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.request.AiAssessmentGenerateRequest;
import com.jpassistant.application.dto.request.AssessmentStartRequest;
import com.jpassistant.application.dto.request.AssessmentSubmitRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.response.AiAssessmentGenerateResponse;
import com.jpassistant.application.dto.response.AiAssessmentQuestionResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.assessment.AssessmentSession;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import com.jpassistant.infrastructure.persistence.jpa.AssessmentSessionJpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AssessmentServiceImplTest {

    private final AiServiceClient aiServiceClient = org.mockito.Mockito.mock(AiServiceClient.class);
    private final AssessmentSessionJpaRepository sessionRepository = org.mockito.Mockito.mock(
            AssessmentSessionJpaRepository.class
    );
    private final PersonalizationService personalizationService = org.mockito.Mockito.mock(
            PersonalizationService.class
    );
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AssessmentServiceImpl service = new AssessmentServiceImpl(
            aiServiceClient,
            sessionRepository,
            personalizationService,
            objectMapper
    );

    @Test
    void startAssessmentStoresAnswerKeyButReturnsPublicQuestionsOnly() {
        when(aiServiceClient.generateAssessment(new AiAssessmentGenerateRequest("N5", "grammar", 2)))
                .thenReturn(new AiAssessmentGenerateResponse(List.of(question("q1", "食べる"))));
        when(sessionRepository.save(any(AssessmentSession.class)))
                .thenAnswer(invocation -> withId(invocation.getArgument(0)));

        var response = service.startAssessment(
                " user-1 ",
                new AssessmentStartRequest("n5", "grammar", 2)
        );

        assertThat(response.sessionId()).isNotNull();
        assertThat(response.level()).isEqualTo("N5");
        assertThat(response.category()).isEqualTo("grammar");
        assertThat(response.questions()).hasSize(1);
        assertThat(response.questions().get(0).id()).isEqualTo("q1");
    }

    @Test
    void submitAssessmentGradesServerSideAndRecordsAssessmentSignals() throws Exception {
        AssessmentSession session = withId(new AssessmentSession(
                "user-1",
                "N5",
                "grammar",
                objectMapper.writeValueAsString(List.of(question("q1", "食べる"))),
                1
        ));
        when(sessionRepository.findByIdAndUserId(session.getId(), "user-1")).thenReturn(Optional.of(session));
        when(personalizationService.recordLearningSignal(any(), any()))
                .thenReturn(progress("user-1", "q1", 0.08));

        var response = service.submitAssessment(
                "user-1",
                session.getId(),
                new AssessmentSubmitRequest(Map.of("q1", "食べる"))
        );

        assertThat(response.score()).isEqualTo(1);
        assertThat(response.total()).isEqualTo(1);
        assertThat(response.weakAreas()).isEmpty();
        assertThat(response.results().get(0).correct()).isTrue();
        assertThat(response.progress()).hasSize(1);
        assertThat(session.isSubmitted()).isTrue();

        verify(personalizationService).recordLearningSignal(
                "user-1",
                new LearningSignalRequest(
                        "GrammarPoint",
                        "q1",
                        "Dictionary form?",
                        "N5",
                        LearningSignalSource.ASSESSMENT,
                        LearningSignalResult.CORRECT
                )
        );
    }

    private AiAssessmentQuestionResponse question(String id, String answer) {
        return new AiAssessmentQuestionResponse(
                id,
                "Dictionary form?",
                List.of("食べる", "食べます"),
                answer,
                "ます形から辞書形にします。"
        );
    }

    private KnowledgeProgressResponse progress(String userId, String knowledgeId, double mastery) {
        return new KnowledgeProgressResponse(
                UUID.randomUUID(),
                userId,
                "GrammarPoint",
                knowledgeId,
                "Dictionary form?",
                "N5",
                mastery,
                0,
                1,
                0,
                null,
                Instant.now(),
                Instant.now(),
                Instant.now()
        );
    }

    private AssessmentSession withId(AssessmentSession session) {
        ReflectionTestUtils.setField(session, "id", UUID.randomUUID());
        return session;
    }
}
