package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.KnowledgeReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.request.PilotSurveyRequest;
import com.jpassistant.application.dto.request.StudentProfileRequest;
import com.jpassistant.application.dto.request.StudyLessonAttemptCompleteRequest;
import com.jpassistant.application.dto.request.StudyLessonAttemptStartRequest;
import com.jpassistant.application.dto.request.StudyFeedbackRequest;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.PilotStudyMetricsResponse;
import com.jpassistant.application.dto.response.PilotSurveyResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.dto.response.StudyLessonAttemptResponse;
import com.jpassistant.application.dto.response.StudyFeedbackResponse;
import com.jpassistant.application.service.PilotStudyMetricsService;
import com.jpassistant.application.service.PersonalizationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/personalization")
public class PersonalizationController {

    private final PersonalizationService personalizationService;
    private final PilotStudyMetricsService pilotStudyMetricsService;

    public PersonalizationController(
            PersonalizationService personalizationService,
            PilotStudyMetricsService pilotStudyMetricsService
    ) {
        this.personalizationService = personalizationService;
        this.pilotStudyMetricsService = pilotStudyMetricsService;
    }

    @GetMapping("/me/profile")
    public StudentProfileResponse getProfile(Authentication authentication) {
        return personalizationService.getOrCreateProfile(authenticatedUserId(authentication));
    }

    @PutMapping("/me/profile")
    public StudentProfileResponse updateProfile(
            @Valid @RequestBody StudentProfileRequest request,
            Authentication authentication
    ) {
        return personalizationService.updateProfile(authenticatedUserId(authentication), request);
    }

    @GetMapping("/me/progress")
    public List<KnowledgeProgressResponse> getProgress(
            @RequestParam(defaultValue = "false") boolean weakOnly,
            @RequestParam(defaultValue = "20") Integer limit,
            Authentication authentication
    ) {
        return personalizationService.getProgress(authenticatedUserId(authentication), weakOnly, limit);
    }

    @PostMapping("/me/progress/exposures")
    public KnowledgeProgressResponse recordExposure(
            @Valid @RequestBody KnowledgeProgressRequest request,
            Authentication authentication
    ) {
        return personalizationService.recordExposure(authenticatedUserId(authentication), request);
    }

    @PostMapping("/me/progress/reviews")
    public KnowledgeProgressResponse recordReview(
            @Valid @RequestBody KnowledgeReviewRequest request,
            Authentication authentication
    ) {
        return personalizationService.recordReview(authenticatedUserId(authentication), request);
    }

    @PostMapping("/me/progress/signals")
    public KnowledgeProgressResponse recordLearningSignal(
            @Valid @RequestBody LearningSignalRequest request,
            Authentication authentication
    ) {
        return personalizationService.recordLearningSignal(authenticatedUserId(authentication), request);
    }

    @PostMapping("/me/feedback")
    public StudyFeedbackResponse recordStudyFeedback(
            @Valid @RequestBody StudyFeedbackRequest request,
            Authentication authentication
    ) {
        return personalizationService.recordStudyFeedback(authenticatedUserId(authentication), request);
    }

    @GetMapping("/me/feedback")
    public List<StudyFeedbackResponse> getStudyFeedback(
            @RequestParam(defaultValue = "20") Integer limit,
            Authentication authentication
    ) {
        return personalizationService.getStudyFeedback(authenticatedUserId(authentication), limit);
    }

    @PostMapping("/me/study-attempts")
    public StudyLessonAttemptResponse startLessonAttempt(
            @Valid @RequestBody StudyLessonAttemptStartRequest request,
            Authentication authentication
    ) {
        return pilotStudyMetricsService.startLessonAttempt(authenticatedUserId(authentication), request);
    }

    @PostMapping("/me/study-attempts/{attemptId}/complete")
    public StudyLessonAttemptResponse completeLessonAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody StudyLessonAttemptCompleteRequest request,
            Authentication authentication
    ) {
        return pilotStudyMetricsService.completeLessonAttempt(
                authenticatedUserId(authentication),
                attemptId,
                request
        );
    }

    @GetMapping("/me/study-attempts")
    public List<StudyLessonAttemptResponse> getLessonAttempts(
            @RequestParam(defaultValue = "100") Integer limit,
            Authentication authentication
    ) {
        return pilotStudyMetricsService.getLessonAttempts(authenticatedUserId(authentication), limit);
    }

    @PostMapping("/me/pilot-surveys")
    public PilotSurveyResponse recordPilotSurvey(
            @Valid @RequestBody PilotSurveyRequest request,
            Authentication authentication
    ) {
        return pilotStudyMetricsService.recordPilotSurvey(authenticatedUserId(authentication), request);
    }

    @GetMapping("/me/metrics")
    public PilotStudyMetricsResponse getLearnerMetrics(Authentication authentication) {
        return pilotStudyMetricsService.getLearnerMetrics(authenticatedUserId(authentication));
    }

    @GetMapping("/pilot-study/metrics")
    public PilotStudyMetricsResponse getPilotStudyMetrics(Authentication authentication) {
        requireAdmin(authentication);
        return pilotStudyMetricsService.getPilotStudyMetrics();
    }

    private String authenticatedUserId(Authentication authentication) {
        return authentication.getName();
    }

    private void requireAdmin(Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "admin role is required");
        }
    }
}
