package com.jpassistant.application.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.request.AiAssessmentGenerateRequest;
import com.jpassistant.application.dto.request.AssessmentStartRequest;
import com.jpassistant.application.dto.request.AssessmentSubmitRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.response.AiAssessmentGenerateResponse;
import com.jpassistant.application.dto.response.AiAssessmentQuestionResponse;
import com.jpassistant.application.dto.response.AssessmentQuestionResponse;
import com.jpassistant.application.dto.response.AssessmentQuestionResultResponse;
import com.jpassistant.application.dto.response.AssessmentStartResponse;
import com.jpassistant.application.dto.response.AssessmentSubmitResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.AssessmentService;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.assessment.AssessmentSession;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import com.jpassistant.infrastructure.persistence.jpa.AssessmentSessionJpaRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssessmentServiceImpl implements AssessmentService {

    private static final int DEFAULT_QUESTION_COUNT = 10;
    private static final int MAX_QUESTION_COUNT = 20;
    private static final TypeReference<List<AiAssessmentQuestionResponse>> QUESTION_LIST_TYPE =
            new TypeReference<>() {
            };

    private final AiServiceClient aiServiceClient;
    private final AssessmentSessionJpaRepository assessmentSessionRepository;
    private final PersonalizationService personalizationService;
    private final ObjectMapper objectMapper;

    public AssessmentServiceImpl(
            AiServiceClient aiServiceClient,
            AssessmentSessionJpaRepository assessmentSessionRepository,
            PersonalizationService personalizationService,
            ObjectMapper objectMapper
    ) {
        this.aiServiceClient = aiServiceClient;
        this.assessmentSessionRepository = assessmentSessionRepository;
        this.personalizationService = personalizationService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public AssessmentStartResponse startAssessment(String userId, AssessmentStartRequest request) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        String level = normalizeLevel(request.level());
        String category = normalizeCategory(request.category());
        int questionCount = normalizeQuestionCount(request.questionCount());
        AiAssessmentGenerateResponse aiResponse = aiServiceClient.generateAssessment(
                new AiAssessmentGenerateRequest(level, category, questionCount)
        );
        List<AiAssessmentQuestionResponse> questions = validateQuestions(aiResponse.questions());
        AssessmentSession session = assessmentSessionRepository.save(new AssessmentSession(
                normalizedUserId,
                level,
                category,
                serialize(questions),
                questions.size()
        ));
        return new AssessmentStartResponse(
                session.getId(),
                level,
                category,
                questions.stream().map(this::toPublicQuestion).toList()
        );
    }

    @Override
    @Transactional
    public AssessmentSubmitResponse submitAssessment(
            String userId,
            UUID sessionId,
            AssessmentSubmitRequest request
    ) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        AssessmentSession session = assessmentSessionRepository.findByIdAndUserId(sessionId, normalizedUserId)
                .orElseThrow(() -> new InvalidRequestException("assessment session was not found"));
        if (session.isSubmitted()) {
            throw new InvalidRequestException("assessment session was already submitted");
        }

        List<AiAssessmentQuestionResponse> questions = deserializeQuestions(session.getQuestionsJson());
        Map<String, String> answers = request.answers() == null ? Map.of() : request.answers();
        List<AssessmentQuestionResultResponse> results = new ArrayList<>();
        List<KnowledgeProgressResponse> progressUpdates = new ArrayList<>();
        Set<String> weakAreas = new LinkedHashSet<>();
        int score = 0;

        for (AiAssessmentQuestionResponse question : questions) {
            String selectedAnswer = optionalText(answers.get(question.id()));
            boolean correct = selectedAnswer != null && selectedAnswer.equals(question.answer());
            if (correct) {
                score++;
            } else {
                weakAreas.add(question.id());
            }
            results.add(new AssessmentQuestionResultResponse(
                    question.id(),
                    selectedAnswer,
                    question.answer(),
                    correct,
                    question.explanation()
            ));
            progressUpdates.add(recordAssessmentSignal(session, question, correct));
        }

        session.submit(score, serialize(answers), serialize(List.copyOf(weakAreas)));
        assessmentSessionRepository.save(session);
        return new AssessmentSubmitResponse(
                session.getId(),
                score,
                questions.size(),
                List.copyOf(weakAreas),
                results,
                progressUpdates
        );
    }

    private KnowledgeProgressResponse recordAssessmentSignal(
            AssessmentSession session,
            AiAssessmentQuestionResponse question,
            boolean correct
    ) {
        return personalizationService.recordLearningSignal(session.getUserId(), new LearningSignalRequest(
                knowledgeType(session.getCategory()),
                question.id(),
                question.prompt(),
                session.getLevel(),
                LearningSignalSource.ASSESSMENT,
                correct ? LearningSignalResult.CORRECT : LearningSignalResult.WRONG
        ));
    }

    private List<AiAssessmentQuestionResponse> validateQuestions(List<AiAssessmentQuestionResponse> questions) {
        if (questions == null || questions.isEmpty()) {
            throw new InvalidRequestException("assessment service returned no questions");
        }
        for (AiAssessmentQuestionResponse question : questions) {
            if (question.id() == null || question.id().isBlank()) {
                throw new InvalidRequestException("assessment question id is required");
            }
            if (question.prompt() == null || question.prompt().isBlank()) {
                throw new InvalidRequestException("assessment question prompt is required");
            }
            if (question.options() == null || question.options().isEmpty()) {
                throw new InvalidRequestException("assessment question options are required");
            }
            if (question.answer() == null || question.answer().isBlank()) {
                throw new InvalidRequestException("assessment question answer is required");
            }
        }
        return questions;
    }

    private AssessmentQuestionResponse toPublicQuestion(AiAssessmentQuestionResponse question) {
        return new AssessmentQuestionResponse(question.id(), question.prompt(), question.options());
    }

    private String knowledgeType(String category) {
        return switch (category.toLowerCase(Locale.ROOT)) {
            case "vocabulary", "vocab" -> "Vocabulary";
            case "grammar" -> "GrammarPoint";
            case "kanji" -> "Kanji";
            default -> "Assessment";
        };
    }

    private String normalizeLevel(String level) {
        return MvpLearningLevels.normalize(level, "N5");
    }

    private String normalizeCategory(String category) {
        String normalized = category == null || category.isBlank() ? "grammar" : category.trim().toLowerCase();
        if (!normalized.matches("[a-z0-9_-]{1,50}")) {
            throw new InvalidRequestException("category must contain only letters, numbers, underscore, or hyphen");
        }
        return normalized;
    }

    private int normalizeQuestionCount(Integer questionCount) {
        if (questionCount == null) {
            return DEFAULT_QUESTION_COUNT;
        }
        return Math.min(Math.max(questionCount, 1), MAX_QUESTION_COUNT);
    }

    private String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException(field + " is required");
        }
        return value.trim();
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private List<AiAssessmentQuestionResponse> deserializeQuestions(String questionsJson) {
        try {
            return objectMapper.readValue(questionsJson, QUESTION_LIST_TYPE);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not deserialize assessment questions", ex);
        }
    }

    private String serialize(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize assessment session data", ex);
        }
    }
}
