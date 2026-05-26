package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.KnowledgeReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.request.StudentProfileRequest;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import com.jpassistant.domain.personalization.KnowledgeProgress;
import com.jpassistant.domain.personalization.StudentProfile;
import com.jpassistant.infrastructure.persistence.jpa.KnowledgeProgressJpaRepository;
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
    private final PersonalizationServiceImpl service = new PersonalizationServiceImpl(
            profileRepository,
            progressRepository
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
        assertThat(response.dailyStudyMinutes()).isEqualTo(45);
        assertThat(response.explanationStyle()).isEqualTo("detailed");
        assertThat(response.romajiEnabled()).isFalse();
        assertThat(response.weakSkills()).containsExactly("grammar", "vocabulary");
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
}
