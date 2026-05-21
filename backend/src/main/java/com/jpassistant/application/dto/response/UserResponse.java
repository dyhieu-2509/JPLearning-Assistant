package com.jpassistant.application.dto.response;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        String avatarUrl,
        String role,
        String status
) {
}
