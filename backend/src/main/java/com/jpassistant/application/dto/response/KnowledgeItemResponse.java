package com.jpassistant.application.dto.response;

public record KnowledgeItemResponse(
        String type,
        String id,
        String title,
        String reading,
        String meaningVi,
        String meaningEn,
        String level,
        String source
) {
}
