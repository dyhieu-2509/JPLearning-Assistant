package com.jpassistant.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jpassistant.auth")
public record AuthProperties(
        String jwtSecret,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        String frontendRedirectUrl
) {

    /**
     * Creates authentication configuration with development-safe defaults.
     */
    public AuthProperties {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            jwtSecret = "dev-secret-change-me-32-bytes-minimum-for-hs256";
        }
        if (accessTokenTtl == null) {
            accessTokenTtl = Duration.ofMinutes(30);
        }
        if (refreshTokenTtl == null) {
            refreshTokenTtl = Duration.ofDays(14);
        }
        if (frontendRedirectUrl == null || frontendRedirectUrl.isBlank()) {
            frontendRedirectUrl = "http://localhost:3000/auth/callback";
        }
    }
}
