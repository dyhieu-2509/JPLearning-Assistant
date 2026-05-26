package com.jpassistant.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.jpassistant.application.dto.ChatRequest;
import com.jpassistant.application.dto.ChatResponse;
import com.jpassistant.application.dto.SourceResponse;
import java.util.List;
import org.junit.jupiter.api.Test;

class ChatServiceImplTest {

    @Test
    void chatDelegatesToAiServiceClient() {
        ChatRequest request = new ChatRequest("て form là gì?", "user-1", "grammar");
        ChatServiceImpl service = new ChatServiceImpl(new StubAiServiceClient());

        ChatResponse response = service.chat(request);

        assertThat(response.answer()).contains("て form");
        assertThat(response.sources()).hasSize(1);
    }

    private static class StubAiServiceClient implements AiServiceClient {

        @Override
        public ChatResponse chat(ChatRequest request) {
            return new ChatResponse(
                    "て form là dạng nối của động từ.",
                    List.of(new SourceResponse("GrammarPoint", "te-form:N5", "te form")),
                    0.7
            );
        }
    }
}
