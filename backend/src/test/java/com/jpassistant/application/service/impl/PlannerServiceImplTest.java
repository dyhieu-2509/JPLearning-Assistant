package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.request.AiPlannerRequest;
import com.jpassistant.application.dto.request.PlannerRecommendRequest;
import com.jpassistant.application.dto.response.AiPlannerResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.dto.response.StudyPlanItemResponse;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.assessment.AssessmentSession;
import com.jpassistant.domain.assessment.AssessmentSessionStatus;
import com.jpassistant.domain.chat.ChatSession;
import com.jpassistant.domain.flashcard.FlashcardCard;
import com.jpassistant.domain.flashcard.FlashcardDeck;
import com.jpassistant.domain.planner.StudyPlan;
import com.jpassistant.domain.planner.StudyPlanItem;
import com.jpassistant.infrastructure.persistence.jpa.AssessmentSessionJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.ChatSessionJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.FlashcardCardJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudyPlanItemJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudyPlanJpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

class PlannerServiceImplTest {

    private final AiServiceClient aiServiceClient = org.mockito.Mockito.mock(AiServiceClient.class);
    private final PersonalizationService personalizationService = org.mockito.Mockito.mock(
            PersonalizationService.class
    );
    private final FlashcardCardJpaRepository flashcardCardRepository = org.mockito.Mockito.mock(
            FlashcardCardJpaRepository.class
    );
    private final ChatSessionJpaRepository chatSessionRepository = org.mockito.Mockito.mock(
            ChatSessionJpaRepository.class
    );
    private final AssessmentSessionJpaRepository assessmentSessionRepository = org.mockito.Mockito.mock(
            AssessmentSessionJpaRepository.class
    );
    private final StudyPlanJpaRepository studyPlanRepository = org.mockito.Mockito.mock(
            StudyPlanJpaRepository.class
    );
    private final StudyPlanItemJpaRepository studyPlanItemRepository = org.mockito.Mockito.mock(
            StudyPlanItemJpaRepository.class
    );
    private final PlannerServiceImpl service = new PlannerServiceImpl(
            aiServiceClient,
            personalizationService,
            flashcardCardRepository,
            chatSessionRepository,
            assessmentSessionRepository,
            studyPlanRepository,
            studyPlanItemRepository,
            new ObjectMapper().findAndRegisterModules()
    );

    @Test
    void recommendCombinesAiPlanWithPersonalizationContext() {
        StudentProfileResponse profile = new StudentProfileResponse(
                UUID.randomUUID(),
                "user-1",
                "N5",
                "N4",
                null,
                "JLPT N4",
                "conversation",
                45,
                "concise",
                true,
                List.of("particles"),
                Instant.now(),
                Instant.now()
        );
        when(personalizationService.getOrCreateProfile("user-1")).thenReturn(profile);
        when(personalizationService.getProgress("user-1", true, 5)).thenReturn(List.of(progress("particle-wa")));

        FlashcardCard dueCard = dueCard();
        when(flashcardCardRepository.findByDeckUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                eq("user-1"),
                any(),
                any(Pageable.class)
        )).thenReturn(List.of(dueCard));
        ChatSession chatSession = new ChatSession("user-1", "te-form follow-up", "grammar");
        when(chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(eq("user-1"), any(Pageable.class)))
                .thenReturn(List.of(chatSession));
        AssessmentSession assessmentSession = assessmentSession();
        when(assessmentSessionRepository.findByUserIdAndStatusOrderBySubmittedAtDesc(
                eq("user-1"),
                eq(AssessmentSessionStatus.SUBMITTED),
                any(Pageable.class)
        )).thenReturn(List.of(assessmentSession));
        when(aiServiceClient.recommendPlan(new AiPlannerRequest("N5", "N4", 6, "Pass N4", "conversation")))
                .thenReturn(new AiPlannerResponse(
                        "N5",
                        "Pass N4",
                        List.of(new StudyPlanItemResponse(1, "AI base plan", "Study core grammar.", 2.0))
                ));
        when(studyPlanRepository.save(any(StudyPlan.class)))
                .thenAnswer(invocation -> withPlanIds(invocation.getArgument(0)));

        var response = service.recommend(
                " user-1 ",
                new PlannerRecommendRequest(null, "N4", 6, "Pass N4", null)
        );

        assertThat(response.planId()).isNotNull();
        assertThat(response.level()).isEqualTo("N5");
        assertThat(response.targetLevel()).isEqualTo("N4");
        assertThat(response.context().weakProgress()).hasSize(1);
        assertThat(response.context().dueFlashcards()).hasSize(1);
        assertThat(response.context().recentChatTopics()).contains("grammar");
        assertThat(response.context().recentAssessment().weakAreas()).contains("q1");
        assertThat(response.context().profile().learningPathway()).isEqualTo("conversation");
        assertThat(response.items()).extracting(StudyPlanItemResponse::title)
                .contains(
                        "Review due flashcards",
                        "Repair weak knowledge",
                        "Fix recent assessment mistakes",
                        "Practice one daily dialogue",
                        "AI base plan",
                        "Follow up recent chat topics"
                );
    }

    @Test
    void completePlanItemMarksItemAndReturnsSavedPlan() {
        StudyPlan plan = withPlanIds(new StudyPlan("user-1", "N5", "N4", "JLPT N4", 5, "{}"));
        StudyPlanItem item = plan.getItems().get(0);
        when(studyPlanItemRepository.findByIdAndPlanIdAndPlanUserId(item.getId(), plan.getId(), "user-1"))
                .thenReturn(Optional.of(item));
        when(studyPlanRepository.findByIdAndUserId(plan.getId(), "user-1")).thenReturn(Optional.of(plan));

        var response = service.completePlanItem("user-1", plan.getId(), item.getId());

        assertThat(response.completedItems()).isEqualTo(1);
        assertThat(response.items().get(0).completed()).isTrue();
    }

    private KnowledgeProgressResponse progress(String knowledgeId) {
        return new KnowledgeProgressResponse(
                UUID.randomUUID(),
                "user-1",
                "GrammarPoint",
                knowledgeId,
                knowledgeId,
                "N5",
                0.2,
                1,
                0,
                2,
                Instant.now(),
                Instant.now(),
                Instant.now(),
                Instant.now()
        );
    }

    private FlashcardCard dueCard() {
        FlashcardDeck deck = new FlashcardDeck("user-1", "N5 vocab", "N5", "vocabulary");
        ReflectionTestUtils.setField(deck, "id", UUID.randomUUID());
        FlashcardCard card = new FlashcardCard(
                deck,
                "tabemasu",
                "eat",
                "tabemasu",
                "Vocabulary",
                "tabemasu:N5",
                "N5"
        );
        ReflectionTestUtils.setField(card, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(card, "nextReviewAt", Instant.now());
        return card;
    }

    private AssessmentSession assessmentSession() {
        AssessmentSession session = new AssessmentSession("user-1", "N5", "grammar", "[]", 2);
        ReflectionTestUtils.setField(session, "id", UUID.randomUUID());
        session.submit(1, "{\"q1\":\"wrong\"}", "[\"q1\"]");
        return session;
    }

    private StudyPlan withPlanIds(StudyPlan plan) {
        ReflectionTestUtils.setField(plan, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(plan, "createdAt", Instant.now());
        ReflectionTestUtils.setField(plan, "updatedAt", Instant.now());
        if (plan.getItems().isEmpty()) {
            plan.addItem(new StudyPlanItem(1, "Review due flashcards", "Review due cards.", 0.5));
        }
        for (StudyPlanItem item : plan.getItems()) {
            ReflectionTestUtils.setField(item, "id", UUID.randomUUID());
        }
        return plan;
    }
}
