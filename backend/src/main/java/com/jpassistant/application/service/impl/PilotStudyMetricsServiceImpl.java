package com.jpassistant.application.service.impl;

import com.jpassistant.application.dto.request.PilotSurveyRequest;
import com.jpassistant.application.dto.request.StudyLessonAttemptCompleteRequest;
import com.jpassistant.application.dto.request.StudyLessonAttemptStartRequest;
import com.jpassistant.application.dto.response.PilotStudyMetricsResponse;
import com.jpassistant.application.dto.response.PilotSurveyResponse;
import com.jpassistant.application.dto.response.StudyLessonAttemptResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.service.PilotStudyMetricsService;
import com.jpassistant.domain.assessment.AssessmentSession;
import com.jpassistant.domain.assessment.AssessmentSessionStatus;
import com.jpassistant.domain.personalization.PilotSurvey;
import com.jpassistant.domain.personalization.StudyFeedback;
import com.jpassistant.domain.personalization.StudyFeedbackMoment;
import com.jpassistant.domain.personalization.StudyLessonAttempt;
import com.jpassistant.domain.personalization.StudyLessonAttemptStatus;
import com.jpassistant.infrastructure.persistence.jpa.AssessmentSessionJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.PilotSurveyJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudyFeedbackJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudyLessonAttemptJpaRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PilotStudyMetricsServiceImpl implements PilotStudyMetricsService {

    private final StudyLessonAttemptJpaRepository attemptRepository;
    private final PilotSurveyJpaRepository surveyRepository;
    private final StudyFeedbackJpaRepository feedbackRepository;
    private final AssessmentSessionJpaRepository assessmentSessionRepository;

    public PilotStudyMetricsServiceImpl(
            StudyLessonAttemptJpaRepository attemptRepository,
            PilotSurveyJpaRepository surveyRepository,
            StudyFeedbackJpaRepository feedbackRepository,
            AssessmentSessionJpaRepository assessmentSessionRepository
    ) {
        this.attemptRepository = attemptRepository;
        this.surveyRepository = surveyRepository;
        this.feedbackRepository = feedbackRepository;
        this.assessmentSessionRepository = assessmentSessionRepository;
    }

    @Override
    @Transactional
    public StudyLessonAttemptResponse startLessonAttempt(String userId, StudyLessonAttemptStartRequest request) {
        StudyLessonAttempt attempt = new StudyLessonAttempt(
                normalizeRequired(userId, "userId"),
                normalizeRequired(request.lessonId(), "lessonId"),
                optionalText(request.lessonTitle()),
                MvpLearningLevels.normalize(request.level(), "N5"),
                optionalText(request.chapterId()),
                optionalText(request.chapterTitle())
        );
        return toAttemptResponse(attemptRepository.save(attempt));
    }

    @Override
    @Transactional
    public StudyLessonAttemptResponse completeLessonAttempt(
            String userId,
            UUID attemptId,
            StudyLessonAttemptCompleteRequest request
    ) {
        StudyLessonAttempt attempt = attemptRepository.findByIdAndUserId(
                        attemptId,
                        normalizeRequired(userId, "userId")
                )
                .orElseThrow(() -> new InvalidRequestException("lesson attempt was not found"));
        if (attempt.getStatus() == StudyLessonAttemptStatus.COMPLETED) {
            throw new InvalidRequestException("lesson attempt was already completed");
        }
        if (request.correctCount() > request.totalQuestions()) {
            throw new InvalidRequestException("correctCount cannot be greater than totalQuestions");
        }
        attempt.complete(
                request.scorePercent(),
                request.correctCount(),
                request.totalQuestions(),
                request.passed()
        );
        return toAttemptResponse(attemptRepository.save(attempt));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudyLessonAttemptResponse> getLessonAttempts(String userId, Integer limit) {
        int safeLimit = limit == null ? 100 : Math.max(1, Math.min(limit, 500));
        return attemptRepository.findByUserIdOrderByStartedAtDesc(normalizeRequired(userId, "userId"))
                .stream()
                .limit(safeLimit)
                .map(this::toAttemptResponse)
                .toList();
    }

    @Override
    @Transactional
    public PilotSurveyResponse recordPilotSurvey(String userId, PilotSurveyRequest request) {
        validateSusScores(request.susScores());
        PilotSurvey survey = new PilotSurvey(
                normalizeRequired(userId, "userId"),
                normalizeRequired(request.contextType(), "contextType"),
                optionalText(request.contextId()),
                optionalText(request.contextTitle()),
                request.susScores(),
                request.trustRating(),
                optionalText(request.comment())
        );
        return toSurveyResponse(surveyRepository.save(survey));
    }

    @Override
    @Transactional(readOnly = true)
    public PilotStudyMetricsResponse getLearnerMetrics(String userId) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        return buildMetrics(
                attemptRepository.findByUserIdOrderByStartedAtDesc(normalizedUserId),
                surveyRepository.findByUserIdOrderByCreatedAtDesc(normalizedUserId),
                feedbackRepository.findByUserIdOrderByCreatedAtDesc(normalizedUserId, org.springframework.data.domain.Pageable.unpaged()),
                assessmentSessionRepository.findByUserIdAndStatusOrderBySubmittedAtAsc(
                        normalizedUserId,
                        AssessmentSessionStatus.SUBMITTED
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PilotStudyMetricsResponse getPilotStudyMetrics() {
        return buildMetrics(
                attemptRepository.findByStatusOrderBySubmittedAtDesc(StudyLessonAttemptStatus.COMPLETED),
                surveyRepository.findAll(),
                feedbackRepository.findAll(),
                assessmentSessionRepository.findByStatusOrderBySubmittedAtAsc(AssessmentSessionStatus.SUBMITTED)
        );
    }

    private PilotStudyMetricsResponse buildMetrics(
            List<StudyLessonAttempt> attempts,
            List<PilotSurvey> surveys,
            List<StudyFeedback> feedback,
            List<AssessmentSession> assessments
    ) {
        List<StudyLessonAttempt> completedAttempts = attempts.stream()
                .filter(attempt -> attempt.getStatus() == StudyLessonAttemptStatus.COMPLETED)
                .toList();
        long passedAttempts = completedAttempts.stream().filter(attempt -> Boolean.TRUE.equals(attempt.getPassed())).count();
        List<StudyFeedback> studyFeedback = feedback.stream()
                .filter(item -> item.getRating() != null)
                .filter(item -> item.getContextType() != null && item.getContextType().startsWith("study_"))
                .toList();
        List<StudyFeedback> tutorFeedback = feedback.stream()
                .filter(item -> item.getMoment() == StudyFeedbackMoment.TUTOR)
                .toList();
        PrePostMetrics prePostMetrics = prePostMetrics(assessments);

        Set<String> learnerIds = new LinkedHashSet<>();
        attempts.forEach(attempt -> learnerIds.add(attempt.getUserId()));
        surveys.forEach(survey -> learnerIds.add(survey.getUserId()));
        feedback.forEach(item -> learnerIds.add(item.getUserId()));
        assessments.forEach(assessment -> learnerIds.add(assessment.getUserId()));

        return new PilotStudyMetricsResponse(
                learnerIds.size(),
                completedAttempts.size(),
                passedAttempts,
                percent(passedAttempts, completedAttempts.size()),
                averageInt(completedAttempts, StudyLessonAttempt::getScorePercent),
                averageLong(completedAttempts, StudyLessonAttempt::durationSeconds),
                feedback.size(),
                averageInt(studyFeedback, StudyFeedback::getRating),
                averageInt(tutorFeedback, StudyFeedback::getClarityRating),
                averageInt(tutorFeedback, StudyFeedback::getTrustRating),
                surveys.size(),
                averageDouble(surveys, PilotSurvey::susScore),
                averageInt(surveys, PilotSurvey::getTrustRating),
                prePostMetrics.pairCount(),
                prePostMetrics.averagePreTestScorePercent(),
                prePostMetrics.averagePostTestScorePercent(),
                prePostMetrics.averageAssessmentGainPercent(),
                countByValue(feedback, StudyFeedback::getDifficultyFit),
                countByValue(feedback, StudyFeedback::getActionChoice),
                countByValue(feedback, StudyFeedback::getPaceChoice),
                recentComments(feedback, surveys),
                Instant.now()
        );
    }

    private PrePostMetrics prePostMetrics(List<AssessmentSession> assessments) {
        Map<String, List<AssessmentSession>> byUser = assessments.stream()
                .filter(session -> session.getSubmittedAt() != null)
                .collect(Collectors.groupingBy(
                        AssessmentSession::getUserId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<Double> preScores = new ArrayList<>();
        List<Double> postScores = new ArrayList<>();
        for (List<AssessmentSession> userSessions : byUser.values()) {
            userSessions.sort(Comparator.comparing(AssessmentSession::getSubmittedAt));
            if (userSessions.size() < 2) {
                continue;
            }
            AssessmentSession first = userSessions.get(0);
            AssessmentSession last = userSessions.get(userSessions.size() - 1);
            preScores.add(scorePercent(first));
            postScores.add(scorePercent(last));
        }

        double averagePre = average(preScores);
        double averagePost = average(postScores);
        return new PrePostMetrics(
                preScores.size(),
                averagePre,
                averagePost,
                roundOne(averagePost - averagePre)
        );
    }

    private double scorePercent(AssessmentSession session) {
        if (session.getTotalQuestions() <= 0 || session.getScore() == null) {
            return 0;
        }
        return ((double) session.getScore() / session.getTotalQuestions()) * 100;
    }

    private List<String> recentComments(List<StudyFeedback> feedback, List<PilotSurvey> surveys) {
        List<CommentEntry> entries = new ArrayList<>();
        feedback.stream()
                .filter(item -> item.getComment() != null && !item.getComment().isBlank())
                .forEach(item -> entries.add(new CommentEntry(item.getCreatedAt(), item.getComment())));
        surveys.stream()
                .filter(item -> item.getComment() != null && !item.getComment().isBlank())
                .forEach(item -> entries.add(new CommentEntry(item.getCreatedAt(), item.getComment())));
        return entries.stream()
                .sorted(Comparator.comparing(CommentEntry::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(10)
                .map(CommentEntry::comment)
                .toList();
    }

    private <T> Map<String, Long> countByValue(List<T> items, Function<T, String> mapper) {
        return items.stream()
                .map(mapper)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.groupingBy(
                        value -> value.trim().toUpperCase(),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));
    }

    private <T> double averageInt(List<T> items, Function<T, Integer> mapper) {
        return roundOne(items.stream()
                .map(mapper)
                .filter(value -> value != null)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0));
    }

    private <T> double averageLong(List<T> items, Function<T, Long> mapper) {
        return roundOne(items.stream()
                .map(mapper)
                .filter(value -> value != null)
                .mapToLong(Long::longValue)
                .average()
                .orElse(0));
    }

    private <T> double averageDouble(List<T> items, Function<T, Double> mapper) {
        return roundOne(items.stream()
                .map(mapper)
                .filter(value -> value != null)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0));
    }

    private double average(List<Double> values) {
        return roundOne(values.stream().mapToDouble(Double::doubleValue).average().orElse(0));
    }

    private double percent(long count, long total) {
        if (total == 0) {
            return 0;
        }
        return roundOne(((double) count / total) * 100);
    }

    private void validateSusScores(List<Integer> scores) {
        if (scores == null || scores.size() != 10) {
            throw new InvalidRequestException("susScores must contain exactly 10 answers");
        }
        boolean invalidScore = scores.stream().anyMatch(score -> score == null || score < 1 || score > 5);
        if (invalidScore) {
            throw new InvalidRequestException("susScores values must be between 1 and 5");
        }
    }

    private StudyLessonAttemptResponse toAttemptResponse(StudyLessonAttempt attempt) {
        return new StudyLessonAttemptResponse(
                attempt.getId(),
                attempt.getUserId(),
                attempt.getLessonId(),
                attempt.getLessonTitle(),
                attempt.getLevel(),
                attempt.getChapterId(),
                attempt.getChapterTitle(),
                attempt.getStatus(),
                attempt.getScorePercent(),
                attempt.getCorrectCount(),
                attempt.getTotalQuestions(),
                attempt.getPassed(),
                attempt.durationSeconds(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.getUpdatedAt()
        );
    }

    private PilotSurveyResponse toSurveyResponse(PilotSurvey survey) {
        return new PilotSurveyResponse(
                survey.getId(),
                survey.getUserId(),
                survey.getContextType(),
                survey.getContextId(),
                survey.getContextTitle(),
                survey.susScores(),
                roundOne(survey.susScore()),
                survey.getTrustRating(),
                survey.getComment(),
                survey.getCreatedAt()
        );
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

    private double roundOne(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record CommentEntry(Instant createdAt, String comment) {
    }

    private record PrePostMetrics(
            long pairCount,
            double averagePreTestScorePercent,
            double averagePostTestScorePercent,
            double averageAssessmentGainPercent
    ) {
    }
}
