package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.request.AssessmentStartRequest;
import com.jpassistant.application.dto.request.AssessmentSubmitRequest;
import com.jpassistant.application.dto.response.AssessmentStartResponse;
import com.jpassistant.application.dto.response.AssessmentSubmitResponse;
import com.jpassistant.application.service.AssessmentService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assessment")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/sessions")
    public AssessmentStartResponse start(
            @Valid @RequestBody AssessmentStartRequest request,
            Authentication authentication
    ) {
        return assessmentService.startAssessment(authentication.getName(), request);
    }

    @PostMapping("/sessions/{sessionId}/submit")
    public AssessmentSubmitResponse submit(
            @PathVariable UUID sessionId,
            @Valid @RequestBody AssessmentSubmitRequest request,
            Authentication authentication
    ) {
        return assessmentService.submitAssessment(authentication.getName(), sessionId, request);
    }
}
