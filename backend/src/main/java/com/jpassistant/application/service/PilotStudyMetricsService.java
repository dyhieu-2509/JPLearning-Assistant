package com.jpassistant.application.service;

import com.jpassistant.application.dto.request.PilotSurveyRequest;
import com.jpassistant.application.dto.request.StudyLessonAttemptCompleteRequest;
import com.jpassistant.application.dto.request.StudyLessonAttemptStartRequest;
import com.jpassistant.application.dto.response.PilotStudyMetricsResponse;
import com.jpassistant.application.dto.response.PilotSurveyResponse;
import com.jpassistant.application.dto.response.StudyLessonAttemptResponse;
import java.util.List;
import java.util.UUID;

public interface PilotStudyMetricsService {

    StudyLessonAttemptResponse startLessonAttempt(String userId, StudyLessonAttemptStartRequest request);

    StudyLessonAttemptResponse completeLessonAttempt(
            String userId,
            UUID attemptId,
            StudyLessonAttemptCompleteRequest request
    );

    List<StudyLessonAttemptResponse> getLessonAttempts(String userId, Integer limit);

    PilotSurveyResponse recordPilotSurvey(String userId, PilotSurveyRequest request);

    PilotStudyMetricsResponse getLearnerMetrics(String userId);

    PilotStudyMetricsResponse getPilotStudyMetrics();
}
