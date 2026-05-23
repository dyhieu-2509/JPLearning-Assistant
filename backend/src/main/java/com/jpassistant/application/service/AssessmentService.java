package com.jpassistant.application.service;

import com.jpassistant.application.dto.request.AssessmentStartRequest;
import com.jpassistant.application.dto.request.AssessmentSubmitRequest;
import com.jpassistant.application.dto.response.AssessmentStartResponse;
import com.jpassistant.application.dto.response.AssessmentSubmitResponse;
import java.util.UUID;

public interface AssessmentService {

    AssessmentStartResponse startAssessment(String userId, AssessmentStartRequest request);

    AssessmentSubmitResponse submitAssessment(String userId, UUID sessionId, AssessmentSubmitRequest request);
}
