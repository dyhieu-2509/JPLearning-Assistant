package com.jpassistant.application.port.out;

import com.jpassistant.application.dto.request.AiAssessmentGenerateRequest;
import com.jpassistant.application.dto.request.AiPlannerRequest;
import com.jpassistant.application.dto.request.AiTutorChatRequest;
import com.jpassistant.application.dto.response.AiAssessmentGenerateResponse;
import com.jpassistant.application.dto.response.AiPlannerResponse;
import com.jpassistant.application.dto.response.ChatResponse;

public interface AiServiceClient {

    /**
     * Sends a learner chat request to the Python AI service.
     *
     * @param request personalized tutor request payload
     * @return generated tutor response
     */
    ChatResponse chat(AiTutorChatRequest request);

    AiAssessmentGenerateResponse generateAssessment(AiAssessmentGenerateRequest request);

    AiPlannerResponse recommendPlan(AiPlannerRequest request);
}
