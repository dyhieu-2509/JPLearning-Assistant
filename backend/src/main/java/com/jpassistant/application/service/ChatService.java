package com.jpassistant.application.service;

import com.jpassistant.application.dto.request.ChatRequest;
import com.jpassistant.application.dto.response.ChatMessageResponse;
import com.jpassistant.application.dto.response.ChatResponse;
import com.jpassistant.application.dto.response.ChatSessionResponse;
import java.util.List;
import java.util.UUID;

public interface ChatService {

    /**
     * Handles a learner chat request.
     *
     * @param request chat request payload
     * @return tutor response from the AI service
     */
    ChatResponse chat(ChatRequest request);

    ChatResponse chat(String authenticatedUserId, ChatRequest request);

    List<ChatSessionResponse> getSessions(String authenticatedUserId, Integer limit);

    List<ChatMessageResponse> getMessages(String authenticatedUserId, UUID sessionId, Integer limit);
}
