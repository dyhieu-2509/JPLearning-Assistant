package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.request.ChatRequest;
import com.jpassistant.application.dto.response.ChatMessageResponse;
import com.jpassistant.application.dto.response.ChatResponse;
import com.jpassistant.application.dto.response.ChatSessionResponse;
import com.jpassistant.application.service.ChatService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    /**
     * Creates the chat API controller.
     *
     * @param chatService chat application service
     */
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Proxies a learner question to the Tutor Agent.
     *
     * @param request chat request payload
     * @return generated tutor response
     */
    @PostMapping
    public ChatResponse chat(@Valid @RequestBody ChatRequest request, Authentication authentication) {
        return chatService.chat(authenticatedUserId(authentication), request);
    }

    @GetMapping("/sessions")
    public List<ChatSessionResponse> sessions(
            @RequestParam(defaultValue = "20") Integer limit,
            Authentication authentication
    ) {
        return chatService.getSessions(authenticatedUserId(authentication), limit);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public List<ChatMessageResponse> messages(
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "100") Integer limit,
            Authentication authentication
    ) {
        return chatService.getMessages(authenticatedUserId(authentication), sessionId, limit);
    }

    private String authenticatedUserId(Authentication authentication) {
        return authentication.getName();
    }
}
