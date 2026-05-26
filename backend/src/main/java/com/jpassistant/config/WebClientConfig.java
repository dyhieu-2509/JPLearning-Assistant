package com.jpassistant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    /**
     * Builds the internal HTTP client used to call the Python AI service.
     *
     * @param properties AI service connection properties
     * @return WebClient configured with the AI service base URL
     */
    @Bean
    public WebClient aiServiceWebClient(AiServiceProperties properties) {
        return WebClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }
}
