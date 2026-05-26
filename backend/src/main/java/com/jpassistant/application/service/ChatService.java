package com.jpassistant.application.service;

import com.jpassistant.application.dto.ChatRequest;
import com.jpassistant.application.dto.ChatResponse;

public interface ChatService {

    /**
     * Handles a learner chat request.
     *
     * @param request chat request payload
     * @return tutor response from the AI service
     */
    ChatResponse chat(ChatRequest request);
}
