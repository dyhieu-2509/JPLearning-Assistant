package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.KnowledgeReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.request.StudentProfileRequest;
import com.jpassistant.application.dto.request.StudyFeedbackRequest;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.domain.personalization.KnowledgeProgress;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import com.jpassistant.domain.personalization.StudyFeedback;
import com.jpassistant.domain.personalization.StudyFeedbackMoment;
import com.jpassistant.domain.personalization.StudentProfile;
import com.jpassistant.infrastructure.persistence.jpa.KnowledgeProgressJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudyFeedbackJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudentProfileJpaRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PersonalizationServiceImplTest {

    private final StudentProfileJpaRepository profileRepository = org.mockito.Mockito.mock(
            StudentProfileJpaRepository.class
    );
    private final KnowledgeProgressJpaRepository progressRepository = org.mockito.Mockito.mock(
            KnowledgeProgressJpaRepository.class
    );
    private final StudyFeedbackJpaRepository feedbackRepository = org.mockito.Mockito.mock(
            StudyFeedbackJpaRepository.class
    );
    private final PersonalizationServiceImpl service = new PersonalizationServiceImpl(
            profileRepository,
            progressRepository,
            feedbackRepository
    );

    @Test
    void updateProfileNormalizesPersonalizationFields() {
        when(profileRepository.findByUserId("user-1")).thenReturn(Optional.empty());
        when(profileRepository.save(any(StudentProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.updateProfile(
                " user-1 ",
                new StudentProfileRequest(
                        "n5",
                        "n4",
                        " https://cdn.example.com/avatar.png ",
                        "  JLPT N4  ",
                        "conversation",
                        45,
                        " detailed ",
                        false,
                        List.of(" Grammar ", "Vocabulary", "")
                )
        );

        assertThat(response.userId()).isEqualTo("user-1");
        assertThat(response.currentLevel()).isEqualTo("N5");
        assertThat(response.targetLevel()).isEqualTo("N4");
        assertThat(response.avatarUrl()).isEqualTo("https://cdn.example.com/avatar.png");
        assertThat(response.goal()).isEqualTo("JLPT N4");
        assertThat(response.learningPathway()).isEqualTo("conversation");
        assertThat(response.dailyStudyMinutes()).isEqualTo(45);
        assertThat(response.explanationStyle()).isEqualTo("detailed");
        assertThat(response.romajiEnabled()).isFalse();
        assertThat(response.weakSkills()).containsExactly("grammar", "vocabulary");
    }

    @Test
    void updateProfileAcceptsZeroBeginnerCurrentLevel() {
        when(profileRepository.findByUserId("zero-user")).thenReturn(Optional.empty());
        when(profileRepository.save(any(StudentProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.updateProfile(
                "zero-user",
                new StudentProfileRequest(
                        "zero",
                        "n5",
                        null,
                        "Start from kana",
                        "jlpt_foundation",
                        20,
                        "step-by-step",
                        true,
                        List.of("kana")
                )
        );

        assertThat(response.currentLevel()).isEqualTo("ZERO");
        assertThat(response.targetLevel()).isEqualTo("N5");
        assertThat(response.weakSkills()).containsExactly("kana");
    }

    @Test
    void recordReviewUpdatesMasteryAndSchedule() {
        when(progressRepository.findByUserIdAndKnowledgeTypeAndKnowledgeId(
                "user-1",
                "Vocabulary",
                "tabemasu:N5"
        )).thenReturn(Optional.empty());
        when(progressRepository.save(any(KnowledgeProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.recordReview(
                "user-1",
                new KnowledgeReviewRequest("Vocabulary", "tabemasu:N5", "tabemasu", "n5", true)
        );

        assertThat(response.userId()).isEqualTo("user-1");
        assertThat(response.knowledgeType()).isEqualTo("Vocabulary");
        assertThat(response.knowledgeId()).isEqualTo("tabemasu:N5");
        assertThat(response.title()).isEqualTo("tabemasu");
        assertThat(response.level()).isEqualTo("N5");
        assertThat(response.correctCount()).isEqualTo(1);
        assertThat(response.wrongCount()).isZero();
        assertThat(response.masteryScore()).isEqualTo(0.08);
        assertThat(response.lastReviewedAt()).isNotNull();
        assertThat(response.nextReviewAt()).isNotNull();
    }

    @Test
    void recordExposureDoesNotChangeMastery() {
        when(progressRepository.findByUserIdAndKnowledgeTypeAndKnowledgeId(
                "user-1",
                "GrammarPoint",
                "te-form:N5"
        )).thenReturn(Optional.empty());
        when(progressRepository.save(any(KnowledgeProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.recordExposure(
                "user-1",
                new KnowledgeProgressRequest("GrammarPoint", "te-form:N5", "te form", "n5")
        );

        assertThat(response.masteryScore()).isZero();
        assertThat(response.exposureCount()).isEqualTo(1);
        assertThat(response.lastExposedAt()).isNotNull();
        assertThat(response.lastReviewedAt()).isNull();
    }

    @Test
    void recordLearningSignalSupportsFlashcardRatings() {
        when(progressRepository.findByUserIdAndKnowledgeTypeAndKnowledgeId(
                "user-1",
                "Vocabulary",
                "tabemasu:N5"
        )).thenReturn(Optional.empty());
        when(progressRepository.save(any(KnowledgeProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.recordLearningSignal(
                "user-1",
                new LearningSignalRequest(
                        "Vocabulary",
                        "tabemasu:N5",
                        "tabemasu",
                        "n5",
                        LearningSignalSource.FLASHCARD,
                        LearningSignalResult.EASY
                )
        );

        assertThat(response.masteryScore()).isEqualTo(0.12);
        assertThat(response.correctCount()).isEqualTo(1);
        assertThat(response.wrongCount()).isZero();
        assertThat(response.nextReviewAt()).isNotNull();
    }

    @Test
    void recordLearningSignalRejectsInvalidSourceResultPair() {
        when(progressRepository.findByUserIdAndKnowledgeTypeAndKnowledgeId(
                "user-1",
                "GrammarPoint",
                "particle-wa:N5"
        )).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.recordLearningSignal(
                "user-1",
                new LearningSignalRequest(
                        "GrammarPoint",
                        "particle-wa:N5",
                        "particle wa",
                        "N5",
                        LearningSignalSource.ASSESSMENT,
                        LearningSignalResult.EASY
                )
        ))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("not valid for source ASSESSMENT");
        verify(progressRepository, never()).save(any(KnowledgeProgress.class));
    }

    @Test
    void recordStudyFeedbackStoresPilotStudySignal() {
        when(feedbackRepository.save(any(StudyFeedback.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.recordStudyFeedback(
                " user-1 ",
                new StudyFeedbackRequest(
                        StudyFeedbackMoment.TUTOR,
                        "floating_tutor",
                        "session-1",
                        "particle wa answer",
                        4,
                        5,
                        4,
                        null,
                        null,
                        "MOVE_ON",
                        "clear enough"
                )
        );

        assertThat(response.userId()).isEqualTo("user-1");
        assertThat(response.moment()).isEqualTo(StudyFeedbackMoment.TUTOR);
        assertThat(response.contextType()).isEqualTo("floating_tutor");
        assertThat(response.contextId()).isEqualTo("session-1");
        assertThat(response.contextTitle()).isEqualTo("particle wa answer");
        assertThat(response.rating()).isEqualTo(4);
        assertThat(response.clarityRating()).isEqualTo(5);
        assertThat(response.trustRating()).isEqualTo(4);
        assertThat(response.actionChoice()).isEqualTo("MOVE_ON");
        assertThat(response.comment()).isEqualTo("clear enough");
    }

    @Test
    void recordStudyFeedbackDoesNotMutateMasteryProgress() {
        when(feedbackRepository.save(any(StudyFeedback.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.recordStudyFeedback(
                "user-1",
                new StudyFeedbackRequest(
                        StudyFeedbackMoment.QUIZ,
                        "study_lesson",
                        "n5-desu-wa",
                        "Bai 1",
                        4,
                        null,
                        null,
                        "JUST_RIGHT",
                        "FAST",
                        "MOVE_ON",
                        null
                )
        );

        verify(progressRepository, never()).save(any(KnowledgeProgress.class));
    }
}
