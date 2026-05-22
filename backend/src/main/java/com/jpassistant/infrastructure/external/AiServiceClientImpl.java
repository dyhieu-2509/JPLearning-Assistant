package com.jpassistant.infrastructure.external;

import com.jpassistant.application.dto.request.AiAssessmentGenerateRequest;
import com.jpassistant.application.dto.request.AiPlannerRequest;
import com.jpassistant.application.dto.request.AiTutorChatRequest;
import com.jpassistant.application.dto.response.AiAssessmentGenerateResponse;
import com.jpassistant.application.dto.response.AiPlannerResponse;
import com.jpassistant.application.dto.response.ChatResponse;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.config.AiServiceProperties;
import java.util.Objects;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class AiServiceClientImpl implements AiServiceClient {

    private final WebClient aiServiceWebClient;
    private final AiServiceProperties properties;

    /**
     * Creates the HTTP client adapter for the Python AI service.
     *
     * @param aiServiceWebClient configured WebClient
     * @param properties AI service timeout properties
     */
    public AiServiceClientImpl(WebClient aiServiceWebClient, AiServiceProperties properties) {
        this.aiServiceWebClient = aiServiceWebClient;
        this.properties = properties;
    }

    /**
     * Sends a learner chat request to the Python AI service.
     *
     * @param request personalized tutor request payload
     * @return generated tutor response
     */
    @Override
    public ChatResponse chat(AiTutorChatRequest request) {
        ChatResponse response = aiServiceWebClient.post()
                .uri("/api/v1/tutor/chat")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ChatResponse.class)
                .block(properties.timeout());

        return Objects.requireNonNull(response, "AI service returned an empty response");
    }

    @Override
    public AiAssessmentGenerateResponse generateAssessment(AiAssessmentGenerateRequest request) {
        AiAssessmentGenerateResponse response = aiServiceWebClient.post()
                .uri("/api/v1/assessment/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiAssessmentGenerateResponse.class)
                .block(properties.timeout());

        return Objects.requireNonNull(response, "AI service returned an empty assessment response");
    }

    @Override
    public AiPlannerResponse recommendPlan(AiPlannerRequest request) {
        AiPlannerResponse response = aiServiceWebClient.post()
                .uri("/api/v1/planner/recommend")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiPlannerResponse.class)
                .block(properties.timeout());

        return Objects.requireNonNull(response, "AI service returned an empty planner response");
    }
}
