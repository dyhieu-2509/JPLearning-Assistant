package com.jpassistant.application.service.impl;

import com.jpassistant.application.exception.InvalidRequestException;
import java.util.Locale;
import java.util.Set;

final class MvpLearningLevels {

    static final String ERROR_MESSAGE = "level must be N5 or N4 for the MVP scope";
    static final String PROFILE_ERROR_MESSAGE = "currentLevel must be ZERO, N5 or N4 for the MVP scope";

    private static final Set<String> SUPPORTED_LEVELS = Set.of("N5", "N4");
    private static final Set<String> SUPPORTED_PROFILE_LEVELS = Set.of("ZERO", "N5", "N4");

    private MvpLearningLevels() {
    }

    static String normalize(String level, String defaultLevel) {
        String normalized = level == null || level.isBlank()
                ? defaultLevel
                : level.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_LEVELS.contains(normalized)) {
            throw new InvalidRequestException(ERROR_MESSAGE);
        }
        return normalized;
    }

    static String normalizeProfileCurrentLevel(String level, String defaultLevel) {
        String normalized = level == null || level.isBlank()
                ? defaultLevel
                : level.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_PROFILE_LEVELS.contains(normalized)) {
            throw new InvalidRequestException(PROFILE_ERROR_MESSAGE);
        }
        return normalized;
    }

    static boolean isZeroBeginner(String level) {
        return level != null && "ZERO".equals(level.trim().toUpperCase(Locale.ROOT));
    }
}
