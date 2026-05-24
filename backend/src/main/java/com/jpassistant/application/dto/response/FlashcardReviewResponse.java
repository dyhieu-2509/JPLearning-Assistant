package com.jpassistant.application.dto.response;

import java.time.Instant;
import java.util.UUID;

public class FlashcardReviewResponse {

    private final FlashcardCardResponse card;
    private final KnowledgeProgressResponse progress;

    public FlashcardReviewResponse(FlashcardCardResponse card, KnowledgeProgressResponse progress) {
        this.card = card;
        this.progress = progress;
    }

    public FlashcardCardResponse getCard() {
        return card;
    }

    public KnowledgeProgressResponse getProgress() {
        return progress;
    }

    public UUID getKnowledgeProgressId() {
        return progress == null ? null : progress.id();
    }

    public String getKnowledgeId() {
        return progress == null ? null : progress.knowledgeId();
    }

    public String getKnowledgeType() {
        return progress == null ? null : progress.knowledgeType();
    }

    public String getTitle() {
        return progress == null ? null : progress.title();
    }

    public String getLevel() {
        return progress == null ? null : progress.level();
    }

    public double getMasteryScore() {
        return progress == null ? 0.0 : progress.masteryScore();
    }

    public int getCorrectCount() {
        return progress == null ? 0 : progress.correctCount();
    }

    public int getWrongCount() {
        return progress == null ? 0 : progress.wrongCount();
    }

    public Instant getNextReviewAt() {
        return progress == null ? null : progress.nextReviewAt();
    }
}
