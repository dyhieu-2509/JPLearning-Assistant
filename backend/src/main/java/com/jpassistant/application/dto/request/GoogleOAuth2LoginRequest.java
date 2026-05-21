package com.jpassistant.application.dto.request;

public record GoogleOAuth2LoginRequest(
        String providerUserId,
        String email,
        boolean emailVerified,
        String displayName,
        String avatarUrl
) {
}
