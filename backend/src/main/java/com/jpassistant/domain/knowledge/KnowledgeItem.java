package com.jpassistant.domain.knowledge;

public record KnowledgeItem(
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
