package com.jpassistant.application.dto.response;

public record AssessmentQuestionResultResponse(
        String questionId,
        String selectedAnswer,
        String correctAnswer,
        boolean correct,
        String explanation
) {
}
