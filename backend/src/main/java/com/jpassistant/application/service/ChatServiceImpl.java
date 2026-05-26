package com.jpassistant.application.service;

import com.jpassistant.application.dto.ChatRequest;
import com.jpassistant.application.dto.ChatResponse;
import org.springframework.stereotype.Service;

@Service
public class ChatServiceImpl implements ChatService {

    private final AiServiceClient aiServiceClient;

    /**
     * Creates the chat service.
     *
     * @param aiServiceClient internal AI service client
     */
    public ChatServiceImpl(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    /**
     * Handles a learner chat request.
     *
     * @param request chat request payload
     * @return tutor response from the AI service
     */
    @Override
    public ChatResponse chat(ChatRequest request) {
        return aiServiceClient.chat(request);
    }
}
