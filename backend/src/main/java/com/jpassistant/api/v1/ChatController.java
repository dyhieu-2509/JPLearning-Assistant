package com.jpassistant.api.v1;

import com.jpassistant.application.dto.ChatRequest;
import com.jpassistant.application.dto.ChatResponse;
import com.jpassistant.application.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return chatService.chat(request);
    }
}
