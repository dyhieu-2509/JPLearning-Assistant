package com.jpassistant.application.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.response.AssessmentSummaryResponse;
import com.jpassistant.application.dto.response.DashboardAssessmentSummaryResponse;
import com.jpassistant.application.dto.response.DashboardChatSummaryResponse;
import com.jpassistant.application.dto.response.DashboardFlashcardSummaryResponse;
import com.jpassistant.application.dto.response.DashboardProgressSummaryResponse;
import com.jpassistant.application.dto.response.FlashcardCardResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.LearnerDashboardResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.service.DashboardService;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.assessment.AssessmentSession;
import com.jpassistant.domain.assessment.AssessmentSessionStatus;
import com.jpassistant.domain.chat.ChatSession;
import com.jpassistant.domain.flashcard.FlashcardCard;
import com.jpassistant.infrastructure.persistence.jpa.AssessmentSessionJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.ChatMessageJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.ChatSessionJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.FlashcardCardJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.KnowledgeProgressJpaRepository;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardServiceImpl implements DashboardService {

    private static final double MASTERED_THRESHOLD = 0.85;
    private static final double WEAK_THRESHOLD = 0.65;
    private static final int SUMMARY_LIMIT = 5;
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final PersonalizationService personalizationService;
    private final KnowledgeProgressJpaRepository progressRepository;
    private final FlashcardCardJpaRepository flashcardCardRepository;
    private final AssessmentSessionJpaRepository assessmentSessionRepository;
    private final ChatSessionJpaRepository chatSessionRepository;
    private final ChatMessageJpaRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    public DashboardServiceImpl(
            PersonalizationService personalizationService,
            KnowledgeProgressJpaRepository progressRepository,
            FlashcardCardJpaRepository flashcardCardRepository,
            AssessmentSessionJpaRepository assessmentSessionRepository,
            ChatSessionJpaRepository chatSessionRepository,
            ChatMessageJpaRepository chatMessageRepository,
            ObjectMapper objectMapper
    ) {
        this.personalizationService = personalizationService;
        this.progressRepository = progressRepository;
        this.flashcardCardRepository = flashcardCardRepository;
        this.assessmentSessionRepository = assessmentSessionRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public LearnerDashboardResponse getLearnerDashboard(String userId) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        StudentProfileResponse profile = personalizationService.getOrCreateProfile(normalizedUserId);
        Instant now = Instant.now();
        return new LearnerDashboardResponse(
                profile,
                progressSummary(normalizedUserId),
                flashcardSummary(normalizedUserId, now),
                assessmentSummary(normalizedUserId),
                chatSummary(normalizedUserId),
                now
        );
    }

    private DashboardProgressSummaryResponse progressSummary(String userId) {
        List<KnowledgeProgressResponse> weakestItems = personalizationService.getProgress(
                userId,
                true,
                SUMMARY_LIMIT
        );
        return new DashboardProgressSummaryResponse(
                progressRepository.countByUserId(userId),
                progressRepository.countByUserIdAndMasteryScoreGreaterThanEqual(userId, MASTERED_THRESHOLD),
                progressRepository.countByUserIdAndMasteryScoreLessThan(userId, WEAK_THRESHOLD),
                roundTwoDecimals(progressRepository.averageMasteryScoreByUserId(userId)),
                weakestItems
        );
    }

    private DashboardFlashcardSummaryResponse flashcardSummary(String userId, Instant now) {
        List<FlashcardCardResponse> dueNow = flashcardCardRepository
                .findByDeckUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        userId,
                        now,
                        PageRequest.of(0, SUMMARY_LIMIT)
                )
                .stream()
                .map(this::toFlashcardResponse)
                .toList();
        return new DashboardFlashcardSummaryResponse(
                flashcardCardRepository.countByDeckUserId(userId),
                flashcardCardRepository.countByDeckUserIdAndNextReviewAtLessThanEqual(userId, now),
                dueNow
        );
    }

    private DashboardAssessmentSummaryResponse assessmentSummary(String userId) {
        List<AssessmentSession> sessions = assessmentSessionRepository.findByUserIdAndStatusOrderBySubmittedAtDesc(
                userId,
                AssessmentSessionStatus.SUBMITTED,
                PageRequest.of(0, 20)
        );
        double averageScore = sessions.stream()
                .filter(session -> session.getTotalQuestions() > 0 && session.getScore() != null)
                .mapToDouble(session -> session.getScore() * 100.0 / session.getTotalQuestions())
                .average()
                .orElse(0.0);
        Set<String> weakAreas = new LinkedHashSet<>();
        for (AssessmentSession session : sessions) {
            weakAreas.addAll(parseWeakAreas(session.getWeakAreasJson()));
            if (weakAreas.size() >= SUMMARY_LIMIT) {
                break;
            }
        }
        AssessmentSummaryResponse latest = sessions.isEmpty() ? null : toAssessmentSummary(sessions.get(0));
        return new DashboardAssessmentSummaryResponse(
                assessmentSessionRepository.countByUserIdAndStatus(userId, AssessmentSessionStatus.SUBMITTED),
                roundTwoDecimals(averageScore),
                latest,
                weakAreas.stream().limit(SUMMARY_LIMIT).toList()
        );
    }

    private DashboardChatSummaryResponse chatSummary(String userId) {
        Set<String> topics = new LinkedHashSet<>();
        for (ChatSession session : chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(
                userId,
                PageRequest.of(0, SUMMARY_LIMIT)
        )) {
            addTopic(topics, session.getContextTopic());
            addTopic(topics, session.getTitle());
        }
        return new DashboardChatSummaryResponse(
                chatSessionRepository.countByUserId(userId),
                chatMessageRepository.countBySessionUserId(userId),
                topics.stream().limit(SUMMARY_LIMIT).toList()
        );
    }

    private AssessmentSummaryResponse toAssessmentSummary(AssessmentSession session) {
        return new AssessmentSummaryResponse(
                session.getId(),
                session.getLevel(),
                session.getCategory(),
                session.getScore() == null ? 0 : session.getScore(),
                session.getTotalQuestions(),
                parseWeakAreas(session.getWeakAreasJson()),
                session.getSubmittedAt()
        );
    }

    private List<String> parseWeakAreas(String weakAreasJson) {
        if (weakAreasJson == null || weakAreasJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(weakAreasJson, STRING_LIST_TYPE);
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private FlashcardCardResponse toFlashcardResponse(FlashcardCard card) {
        return new FlashcardCardResponse(
                card.getId(),
                card.getDeck().getId(),
                card.getFrontText(),
                card.getBackText(),
                card.getReading(),
                card.getSourceType(),
                card.getSourceId(),
                card.getLevel(),
                card.getEasinessFactor(),
                card.getIntervalDays(),
                card.getRepetitions(),
                card.getNextReviewAt(),
                card.getLastReviewedAt()
        );
    }

    private void addTopic(Set<String> topics, String topic) {
        if (topic != null && !topic.isBlank() && topics.size() < SUMMARY_LIMIT) {
            topics.add(topic.trim());
        }
    }

    private String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException(field + " is required");
        }
        return value.trim();
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
