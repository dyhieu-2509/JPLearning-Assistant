package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StudentProfileResponse(
        UUID id,
        String userId,
        String currentLevel,
        String targetLevel,
        String avatarUrl,
        String goal,
        String learningPathway,
        int dailyStudyMinutes,
        String explanationStyle,
        boolean romajiEnabled,
        List<String> weakSkills,
        Instant createdAt,
        Instant updatedAt
) {
}
