package com.jpassistant.infrastructure.external;

import com.jpassistant.application.dto.ChatRequest;
import com.jpassistant.application.dto.ChatResponse;
import com.jpassistant.application.service.AiServiceClient;
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
     * @param request chat request payload
     * @return generated tutor response
     */
    @Override
    public ChatResponse chat(ChatRequest request) {
        ChatResponse response = aiServiceWebClient.post()
                .uri("/api/v1/tutor/chat")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ChatResponse.class)
                .block(properties.timeout());

        return Objects.requireNonNull(response, "AI service returned an empty response");
    }
}
