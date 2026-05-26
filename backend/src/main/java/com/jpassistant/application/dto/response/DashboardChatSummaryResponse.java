package com.jpassistant.application.dto.response;

import java.util.List;

public record DashboardChatSummaryResponse(
        long sessionCount,
        long messageCount,
        List<String> recentTopics
) {
}
