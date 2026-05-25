package com.jpassistant.application.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.request.AiPlannerRequest;
import com.jpassistant.application.dto.request.PlannerRecommendRequest;
import com.jpassistant.application.dto.response.AiPlannerResponse;
import com.jpassistant.application.dto.response.AssessmentSummaryResponse;
import com.jpassistant.application.dto.response.FlashcardCardResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.PlannerContextResponse;
import com.jpassistant.application.dto.response.PlannerRecommendationResponse;
import com.jpassistant.application.dto.response.SavedStudyPlanItemResponse;
import com.jpassistant.application.dto.response.SavedStudyPlanResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.dto.response.StudyPlanItemResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.application.service.PlannerService;
import com.jpassistant.domain.assessment.AssessmentSession;
import com.jpassistant.domain.assessment.AssessmentSessionStatus;
import com.jpassistant.domain.chat.ChatSession;
import com.jpassistant.domain.flashcard.FlashcardCard;
import com.jpassistant.domain.planner.StudyPlan;
import com.jpassistant.domain.planner.StudyPlanItem;
import com.jpassistant.infrastructure.persistence.jpa.AssessmentSessionJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.ChatSessionJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.FlashcardCardJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudyPlanItemJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudyPlanJpaRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlannerServiceImpl implements PlannerService {

    private static final int WEAK_PROGRESS_LIMIT = 5;
    private static final int DUE_CARD_LIMIT = 5;
    private static final int RECENT_CHAT_LIMIT = 5;
    private static final int DEFAULT_PLAN_LIMIT = 10;
    private static final int MAX_PLAN_LIMIT = 50;
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final AiServiceClient aiServiceClient;
    private final PersonalizationService personalizationService;
    private final FlashcardCardJpaRepository flashcardCardRepository;
    private final ChatSessionJpaRepository chatSessionRepository;
    private final AssessmentSessionJpaRepository assessmentSessionRepository;
    private final StudyPlanJpaRepository studyPlanRepository;
    private final StudyPlanItemJpaRepository studyPlanItemRepository;
    private final ObjectMapper objectMapper;

    public PlannerServiceImpl(
            AiServiceClient aiServiceClient,
            PersonalizationService personalizationService,
            FlashcardCardJpaRepository flashcardCardRepository,
            ChatSessionJpaRepository chatSessionRepository,
            AssessmentSessionJpaRepository assessmentSessionRepository,
            StudyPlanJpaRepository studyPlanRepository,
            StudyPlanItemJpaRepository studyPlanItemRepository,
            ObjectMapper objectMapper
    ) {
        this.aiServiceClient = aiServiceClient;
        this.personalizationService = personalizationService;
        this.flashcardCardRepository = flashcardCardRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.assessmentSessionRepository = assessmentSessionRepository;
        this.studyPlanRepository = studyPlanRepository;
        this.studyPlanItemRepository = studyPlanItemRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public PlannerRecommendationResponse recommend(String userId, PlannerRecommendRequest request) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        PlannerRecommendRequest safeRequest = request == null
                ? new PlannerRecommendRequest(null, null, null, null)
                : request;
        StudentProfileResponse profile = personalizationService.getOrCreateProfile(normalizedUserId);
        String currentLevel = defaultText(safeRequest.currentLevel(), profile.currentLevel());
        String targetLevel = defaultText(safeRequest.targetLevel(), profile.targetLevel());
        String goal = defaultText(safeRequest.goal(), profile.goal());
        int weeklyStudyHours = normalizeWeeklyHours(safeRequest.weeklyStudyHours(), profile.dailyStudyMinutes());

        List<KnowledgeProgressResponse> weakProgress = personalizationService.getProgress(
                normalizedUserId,
                true,
                WEAK_PROGRESS_LIMIT
        );
        List<FlashcardCardResponse> dueCards = flashcardCardRepository
                .findByDeckUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        normalizedUserId,
                        Instant.now(),
                        PageRequest.of(0, DUE_CARD_LIMIT)
                )
                .stream()
                .map(this::toFlashcardResponse)
                .toList();
        List<String> recentChatTopics = recentChatTopics(normalizedUserId);
        AssessmentSummaryResponse recentAssessment = recentAssessment(normalizedUserId);

        AiPlannerResponse aiPlan = aiServiceClient.recommendPlan(new AiPlannerRequest(
                currentLevel,
                targetLevel,
                weeklyStudyHours,
                goal
        ));
        PlannerContextResponse context = new PlannerContextResponse(
                profile,
                weakProgress,
                dueCards,
                recentChatTopics,
                recentAssessment
        );
        List<StudyPlanItemResponse> items = personalizeItems(aiPlan.items(), context, weeklyStudyHours);
        StudyPlan savedPlan = saveStudyPlan(
                normalizedUserId,
                currentLevel,
                targetLevel,
                goal,
                weeklyStudyHours,
                items,
                context
        );
        return new PlannerRecommendationResponse(
                savedPlan.getId(),
                currentLevel,
                targetLevel,
                goal,
                weeklyStudyHours,
                items,
                context
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SavedStudyPlanResponse> listPlans(String userId, Integer limit) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        return studyPlanRepository.findByUserIdOrderByCreatedAtDesc(
                        normalizedUserId,
                        PageRequest.of(0, normalizeLimit(limit))
                )
                .stream()
                .map(this::toSavedPlanResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SavedStudyPlanResponse getPlan(String userId, UUID planId) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        return toSavedPlanResponse(findPlan(normalizedUserId, planId));
    }

    @Override
    @Transactional
    public SavedStudyPlanResponse completePlanItem(String userId, UUID planId, UUID itemId) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        StudyPlanItem item = studyPlanItemRepository.findByIdAndPlanIdAndPlanUserId(
                        itemId,
                        planId,
                        normalizedUserId
                )
                .orElseThrow(() -> new InvalidRequestException("study plan item was not found"));
        item.markCompleted();
        studyPlanItemRepository.save(item);
        return toSavedPlanResponse(findPlan(normalizedUserId, planId));
    }

    private StudyPlan saveStudyPlan(
            String userId,
            String currentLevel,
            String targetLevel,
            String goal,
            int weeklyStudyHours,
            List<StudyPlanItemResponse> items,
            PlannerContextResponse context
    ) {
        StudyPlan plan = new StudyPlan(
                userId,
                currentLevel,
                targetLevel,
                goal,
                weeklyStudyHours,
                serialize(context)
        );
        for (StudyPlanItemResponse item : items) {
            plan.addItem(new StudyPlanItem(
                    item.order(),
                    item.title(),
                    item.objective(),
                    item.estimatedHours()
            ));
        }
        return studyPlanRepository.save(plan);
    }

    private List<StudyPlanItemResponse> personalizeItems(
            List<StudyPlanItemResponse> aiItems,
            PlannerContextResponse context,
            int weeklyStudyHours
    ) {
        List<StudyPlanItemResponse> items = new ArrayList<>();
        if (!context.dueFlashcards().isEmpty()) {
            items.add(new StudyPlanItemResponse(
                    0,
                    "Review due flashcards",
                    "Review " + context.dueFlashcards().size() + " due cards before learning new material.",
                    Math.max(0.5, roundOneDecimal(weeklyStudyHours * 0.15))
            ));
        }
        if (!context.weakProgress().isEmpty()) {
            items.add(new StudyPlanItemResponse(
                    0,
                    "Repair weak knowledge",
                    "Focus on " + summarizeWeakProgress(context.weakProgress()) + " because mastery is still low.",
                    Math.max(0.5, roundOneDecimal(weeklyStudyHours * 0.25))
            ));
        }
        if (context.recentAssessment() != null && !context.recentAssessment().weakAreas().isEmpty()) {
            items.add(new StudyPlanItemResponse(
                    0,
                    "Fix recent assessment mistakes",
                    "Re-study weak assessment areas: " + String.join(", ", context.recentAssessment().weakAreas()),
                    Math.max(0.5, roundOneDecimal(weeklyStudyHours * 0.2))
            ));
        }
        if (aiItems != null) {
            items.addAll(aiItems);
        }
        if (!context.recentChatTopics().isEmpty()) {
            items.add(new StudyPlanItemResponse(
                    0,
                    "Follow up recent chat topics",
                    "Turn recent chat topics into practice tasks: " + String.join(", ", context.recentChatTopics()),
                    Math.max(0.5, roundOneDecimal(weeklyStudyHours * 0.1))
            ));
        }
        if (items.isEmpty()) {
            items.add(new StudyPlanItemResponse(
                    0,
                    "Start with core N5 review",
                    "Create baseline progress by studying vocabulary, grammar, and a short quiz.",
                    Math.max(1.0, roundOneDecimal(weeklyStudyHours))
            ));
        }
        List<StudyPlanItemResponse> ordered = new ArrayList<>();
        for (int index = 0; index < items.size(); index++) {
            StudyPlanItemResponse item = items.get(index);
            ordered.add(new StudyPlanItemResponse(
                    index + 1,
                    item.title(),
                    item.objective(),
                    item.estimatedHours()
            ));
        }
        return ordered;
    }

    private List<String> recentChatTopics(String userId) {
        Set<String> topics = new LinkedHashSet<>();
        for (ChatSession session : chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(
                userId,
                PageRequest.of(0, RECENT_CHAT_LIMIT)
        )) {
            addTopic(topics, session.getContextTopic());
            addTopic(topics, session.getTitle());
        }
        return List.copyOf(topics);
    }

    private AssessmentSummaryResponse recentAssessment(String userId) {
        return assessmentSessionRepository.findByUserIdAndStatusOrderBySubmittedAtDesc(
                        userId,
                        AssessmentSessionStatus.SUBMITTED,
                        PageRequest.of(0, 1)
                )
                .stream()
                .findFirst()
                .map(this::toAssessmentSummary)
                .orElse(null);
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

    private SavedStudyPlanResponse toSavedPlanResponse(StudyPlan plan) {
        List<SavedStudyPlanItemResponse> items = plan.getItems().stream()
                .sorted(Comparator.comparingInt(StudyPlanItem::getItemOrder))
                .map(this::toSavedItemResponse)
                .toList();
        long completedItems = items.stream().filter(SavedStudyPlanItemResponse::completed).count();
        double completionRate = items.isEmpty() ? 0.0 : roundOneDecimal(completedItems * 100.0 / items.size());
        return new SavedStudyPlanResponse(
                plan.getId(),
                plan.getLevel(),
                plan.getTargetLevel(),
                plan.getGoal(),
                plan.getWeeklyStudyHours(),
                completedItems,
                items.size(),
                completionRate,
                items,
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }

    private SavedStudyPlanItemResponse toSavedItemResponse(StudyPlanItem item) {
        return new SavedStudyPlanItemResponse(
                item.getId(),
                item.getItemOrder(),
                item.getTitle(),
                item.getObjective(),
                item.getEstimatedHours(),
                item.isCompleted(),
                item.getCompletedAt()
        );
    }

    private StudyPlan findPlan(String userId, UUID planId) {
        if (planId == null) {
            throw new InvalidRequestException("planId is required");
        }
        return studyPlanRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new InvalidRequestException("study plan was not found"));
    }

    private String summarizeWeakProgress(List<KnowledgeProgressResponse> weakProgress) {
        return String.join(", ", weakProgress.stream()
                .limit(3)
                .map(progress -> progress.title() == null || progress.title().isBlank()
                        ? progress.knowledgeId()
                        : progress.title())
                .toList());
    }

    private void addTopic(Set<String> topics, String topic) {
        if (topic != null && !topic.isBlank() && topics.size() < RECENT_CHAT_LIMIT) {
            topics.add(topic.trim());
        }
    }

    private int normalizeWeeklyHours(Integer requestedHours, int dailyStudyMinutes) {
        if (requestedHours != null) {
            return Math.min(Math.max(requestedHours, 1), 40);
        }
        return Math.min(Math.max((int) Math.ceil(dailyStudyMinutes * 7.0 / 60.0), 1), 40);
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_PLAN_LIMIT;
        }
        return Math.min(Math.max(limit, 1), MAX_PLAN_LIMIT);
    }

    private String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException(field + " is required");
        }
        return value.trim();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String serialize(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize study plan context", ex);
        }
    }
}
