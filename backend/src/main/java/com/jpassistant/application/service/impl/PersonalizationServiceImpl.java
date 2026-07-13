package com.jpassistant.application.service.impl;

import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.KnowledgeReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.request.StudentProfileRequest;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.personalization.KnowledgeProgress;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import com.jpassistant.domain.personalization.StudentProfile;
import com.jpassistant.infrastructure.persistence.jpa.KnowledgeProgressJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudentProfileJpaRepository;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PersonalizationServiceImpl implements PersonalizationService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 100;
    private static final double WEAK_MASTERY_THRESHOLD = 0.65;

    private final StudentProfileJpaRepository profileRepository;
    private final KnowledgeProgressJpaRepository progressRepository;

    public PersonalizationServiceImpl(
            StudentProfileJpaRepository profileRepository,
            KnowledgeProgressJpaRepository progressRepository
    ) {
        this.profileRepository = profileRepository;
        this.progressRepository = progressRepository;
    }

    @Override
    @Transactional
    public StudentProfileResponse getOrCreateProfile(String userId) {
        String normalizedUserId = normalizeUserId(userId);
        StudentProfile profile = profileRepository.findByUserId(normalizedUserId)
                .orElseGet(() -> profileRepository.save(new StudentProfile(normalizedUserId)));
        return toProfileResponse(profile);
    }

    @Override
    @Transactional
    public StudentProfileResponse updateProfile(String userId, StudentProfileRequest request) {
        String normalizedUserId = normalizeUserId(userId);
        StudentProfile profile = profileRepository.findByUserId(normalizedUserId)
                .orElseGet(() -> new StudentProfile(normalizedUserId));

        profile.setCurrentLevel(normalizeLevel(request.currentLevel(), "N5"));
        profile.setTargetLevel(normalizeLevel(request.targetLevel(), "N4"));
        profile.setAvatarUrl(optionalText(request.avatarUrl()));
        profile.setGoal(defaultText(request.goal(), "JLPT preparation"));
        profile.setLearningPathway(LearningPathways.normalize(request.learningPathway()));
        profile.setDailyStudyMinutes(request.dailyStudyMinutes() == null ? 30 : request.dailyStudyMinutes());
        profile.setExplanationStyle(defaultText(request.explanationStyle(), "concise"));
        profile.setRomajiEnabled(request.romajiEnabled() == null || request.romajiEnabled());
        profile.setWeakSkills(normalizeWeakSkills(request.weakSkills()));
        profile.touch();

        return toProfileResponse(profileRepository.save(profile));
    }

    @Override
    @Transactional(readOnly = true)
    public List<KnowledgeProgressResponse> getProgress(String userId, boolean weakOnly, Integer limit) {
        String normalizedUserId = normalizeUserId(userId);
        PageRequest page = PageRequest.of(0, normalizeLimit(limit));
        List<KnowledgeProgress> progress = weakOnly
                ? progressRepository.findByUserIdAndMasteryScoreLessThanOrderByMasteryScoreAscUpdatedAtDesc(
                        normalizedUserId,
                        WEAK_MASTERY_THRESHOLD,
                        page
                )
                : progressRepository.findByUserIdOrderByMasteryScoreAscUpdatedAtDesc(normalizedUserId, page);
        return progress.stream().map(this::toProgressResponse).toList();
    }

    @Override
    @Transactional
    public KnowledgeProgressResponse recordExposure(String userId, KnowledgeProgressRequest request) {
        KnowledgeProgress progress = findOrCreateProgress(
                userId,
                request.knowledgeType(),
                request.knowledgeId()
        );
        applyItemMetadata(progress, request.title(), request.level());
        progress.recordExposure();
        return toProgressResponse(progressRepository.save(progress));
    }

    @Override
    @Transactional
    public KnowledgeProgressResponse recordReview(String userId, KnowledgeReviewRequest request) {
        return recordLearningSignal(userId, new LearningSignalRequest(
                request.knowledgeType(),
                request.knowledgeId(),
                request.title(),
                request.level(),
                LearningSignalSource.QUIZ,
                request.correct() ? LearningSignalResult.CORRECT : LearningSignalResult.WRONG
        ));
    }

    @Override
    @Transactional
    public KnowledgeProgressResponse recordLearningSignal(String userId, LearningSignalRequest request) {
        KnowledgeProgress progress = findOrCreateProgress(
                userId,
                request.knowledgeType(),
                request.knowledgeId()
        );
        applyItemMetadata(progress, request.title(), request.level());
        validateSignal(request.source(), request.result());
        progress.recordLearningSignal(request.source(), request.result());
        return toProgressResponse(progressRepository.save(progress));
    }

    private void validateSignal(LearningSignalSource source, LearningSignalResult result) {
        if (source == null) {
            throw new InvalidRequestException("learning signal source is required");
        }
        if (result == null) {
            throw new InvalidRequestException("learning signal result is required");
        }
        EnumSet<LearningSignalResult> allowedResults = switch (source) {
            case QUIZ, ASSESSMENT -> EnumSet.of(LearningSignalResult.CORRECT, LearningSignalResult.WRONG);
            case FLASHCARD -> EnumSet.of(
                    LearningSignalResult.AGAIN,
                    LearningSignalResult.HARD,
                    LearningSignalResult.GOOD,
                    LearningSignalResult.EASY
            );
            case EXPLICIT_FEEDBACK -> EnumSet.allOf(LearningSignalResult.class);
        };
        if (!allowedResults.contains(result)) {
            throw new InvalidRequestException("result " + result + " is not valid for source " + source);
        }
    }

    private KnowledgeProgress findOrCreateProgress(String userId, String knowledgeType, String knowledgeId) {
        String normalizedUserId = normalizeUserId(userId);
        String normalizedType = normalizeRequired(knowledgeType, "knowledgeType");
        String normalizedId = normalizeRequired(knowledgeId, "knowledgeId");
        return progressRepository.findByUserIdAndKnowledgeTypeAndKnowledgeId(
                        normalizedUserId,
                        normalizedType,
                        normalizedId
                )
                .orElseGet(() -> new KnowledgeProgress(normalizedUserId, normalizedType, normalizedId));
    }

    private void applyItemMetadata(KnowledgeProgress progress, String title, String level) {
        progress.setTitle(defaultText(title, progress.getKnowledgeId()));
        progress.setLevel(normalizeLevel(level, "N5"));
    }

    private String normalizeUserId(String userId) {
        return normalizeRequired(userId, "userId");
    }

    private String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException(field + " is required");
        }
        return value.trim();
    }

    private String normalizeLevel(String level, String defaultLevel) {
        return MvpLearningLevels.normalize(level, defaultLevel);
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        return Math.min(Math.max(limit, 1), MAX_LIMIT);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Set<String> normalizeWeakSkills(List<String> weakSkills) {
        Set<String> normalized = new LinkedHashSet<>();
        if (weakSkills == null) {
            return normalized;
        }
        for (String skill : weakSkills) {
            if (skill != null && !skill.isBlank()) {
                normalized.add(skill.trim().toLowerCase());
            }
        }
        return normalized;
    }

    private StudentProfileResponse toProfileResponse(StudentProfile profile) {
        return new StudentProfileResponse(
                profile.getId(),
                profile.getUserId(),
                profile.getCurrentLevel(),
                profile.getTargetLevel(),
                profile.getAvatarUrl(),
                profile.getGoal(),
                LearningPathways.normalize(profile.getLearningPathway()),
                profile.getDailyStudyMinutes(),
                profile.getExplanationStyle(),
                profile.isRomajiEnabled(),
                List.copyOf(profile.getWeakSkills()),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private KnowledgeProgressResponse toProgressResponse(KnowledgeProgress progress) {
        return new KnowledgeProgressResponse(
                progress.getId(),
                progress.getUserId(),
                progress.getKnowledgeType(),
                progress.getKnowledgeId(),
                progress.getTitle(),
                progress.getLevel(),
                progress.getMasteryScore(),
                progress.getExposureCount(),
                progress.getCorrectCount(),
                progress.getWrongCount(),
                progress.getLastExposedAt(),
                progress.getLastReviewedAt(),
                progress.getNextReviewAt(),
                progress.getUpdatedAt()
        );
    }
}
