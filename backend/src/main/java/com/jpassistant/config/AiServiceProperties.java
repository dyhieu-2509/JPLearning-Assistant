package com.jpassistant.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jpassistant.ai-service")
public record AiServiceProperties(String baseUrl, Duration timeout) {

    /**
     * Creates AI service configuration with safe local defaults for development.
     */
    public AiServiceProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8000";
        }
        if (timeout == null) {
            timeout = Duration.ofSeconds(12);
        }
    }
}
