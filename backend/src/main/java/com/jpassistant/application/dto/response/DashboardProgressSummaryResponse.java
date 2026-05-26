package com.jpassistant.application.dto.response;

import java.util.List;

public record DashboardProgressSummaryResponse(
        long totalItems,
        long masteredItems,
        long weakItems,
        double averageMasteryScore,
        List<KnowledgeProgressResponse> weakestItems
) {
}
