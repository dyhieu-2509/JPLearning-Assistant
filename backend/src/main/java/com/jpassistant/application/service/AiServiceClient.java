package com.jpassistant.application.service;

import com.jpassistant.application.dto.ChatRequest;
import com.jpassistant.application.dto.ChatResponse;

public interface AiServiceClient {

    /**
     * Sends a learner chat request to the Python AI service.
     *
     * @param request chat request payload
     * @return generated tutor response
     */
    ChatResponse chat(ChatRequest request);
}
