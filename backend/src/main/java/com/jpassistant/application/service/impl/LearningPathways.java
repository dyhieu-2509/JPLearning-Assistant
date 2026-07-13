package com.jpassistant.application.service.impl;

import com.jpassistant.application.exception.InvalidRequestException;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

final class LearningPathways {

    static final String DEFAULT = "jlpt_foundation";

    private static final Set<String> SUPPORTED_PATHWAYS = Set.of(
            DEFAULT,
            "conversation",
            "school",
            "work",
            "reading"
    );
    private static final Map<String, String> LABELS = Map.of(
            DEFAULT, "JLPT foundation",
            "conversation", "Daily conversation",
            "school", "Classroom study",
            "work", "Workplace Japanese",
            "reading", "Reading practice"
    );

    private LearningPathways() {
    }

    static String normalize(String pathway) {
        String normalized = pathway == null || pathway.isBlank()
                ? DEFAULT
                : pathway.trim().toLowerCase(Locale.ROOT).replace('-', '_');
        if (!SUPPORTED_PATHWAYS.contains(normalized)) {
            throw new InvalidRequestException(
                    "learningPathway must be jlpt_foundation, conversation, school, work, or reading"
            );
        }
        return normalized;
    }

    static String label(String pathway) {
        return LABELS.getOrDefault(normalize(pathway), LABELS.get(DEFAULT));
    }
}
