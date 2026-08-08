package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PilotStudyMetricsResponse(
        long learnerCount,
        long completedLessonAttempts,
        long passedLessonAttempts,
        double passRatePercent,
        double averageLessonScorePercent,
        double averageCompletionSeconds,
        long feedbackResponses,
        double averageStudyRating,
        double averageTutorClarity,
        double averageTutorTrust,
        long surveyResponses,
        double averageSusScore,
        double averageSurveyTrust,
        long assessmentPairCount,
        double averagePreTestScorePercent,
        double averagePostTestScorePercent,
        double averageAssessmentGainPercent,
        Map<String, Long> difficultyFitCounts,
        Map<String, Long> actionChoiceCounts,
        Map<String, Long> paceChoiceCounts,
        List<String> recentComments,
        Instant generatedAt
) {
}
