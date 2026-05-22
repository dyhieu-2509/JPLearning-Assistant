package com.jpassistant.domain.personalization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "knowledge_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_knowledge_progress_user_item",
                columnNames = {"user_id", "knowledge_type", "knowledge_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KnowledgeProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "knowledge_type", nullable = false, length = 50)
    private String knowledgeType;

    @Column(name = "knowledge_id", nullable = false, length = 200)
    private String knowledgeId;

    @Column(name = "title", nullable = false, length = 200)
    @Setter
    private String title = "";

    @Column(name = "level", nullable = false, length = 2)
    @Setter
    private String level = "N5";

    @Column(name = "mastery_score", nullable = false)
    private double masteryScore = 0.0;

    @Column(name = "exposure_count", nullable = false, columnDefinition = "integer default 0")
    private int exposureCount;

    @Column(name = "correct_count", nullable = false)
    private int correctCount;

    @Column(name = "wrong_count", nullable = false)
    private int wrongCount;

    @Column(name = "last_exposed_at")
    private Instant lastExposedAt;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "next_review_at")
    private Instant nextReviewAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public KnowledgeProgress(String userId, String knowledgeType, String knowledgeId) {
        this.userId = userId;
        this.knowledgeType = knowledgeType;
        this.knowledgeId = knowledgeId;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }

    public void recordExposure() {
        this.exposureCount++;
        this.lastExposedAt = Instant.now();
        touch();
    }

    public void recordReview(boolean correct) {
        recordLearningSignal(
                LearningSignalSource.QUIZ,
                correct ? LearningSignalResult.CORRECT : LearningSignalResult.WRONG
        );
    }

    public void recordLearningSignal(LearningSignalSource source, LearningSignalResult result) {
        if (source == null || result == null) {
            throw new IllegalArgumentException("learning signal source and result are required");
        }
        this.lastReviewedAt = Instant.now();
        if (isPositiveResult(result)) {
            this.correctCount++;
            this.masteryScore = clamp(this.masteryScore + masteryDelta(result));
        } else {
            this.wrongCount++;
            this.masteryScore = clamp(this.masteryScore + masteryDelta(result));
        }
        this.nextReviewAt = this.lastReviewedAt.plus(Duration.ofDays(nextReviewDays(result)));
    }

    private boolean isPositiveResult(LearningSignalResult result) {
        return switch (result) {
            case CORRECT, HARD, GOOD, EASY -> true;
            case WRONG, AGAIN -> false;
        };
    }

    private double masteryDelta(LearningSignalResult result) {
        return switch (result) {
            case EASY -> 0.12;
            case CORRECT, GOOD -> 0.08;
            case HARD -> 0.02;
            case WRONG -> -0.12;
            case AGAIN -> -0.15;
        };
    }

    private int nextReviewDays(LearningSignalResult result) {
        if (result == LearningSignalResult.AGAIN) {
            return 1;
        }
        if (result == LearningSignalResult.HARD) {
            return 2;
        }
        if (result == LearningSignalResult.EASY && masteryScore >= 0.65) {
            return 14;
        }
        if (masteryScore >= 0.85) {
            return 14;
        }
        if (masteryScore >= 0.65) {
            return 7;
        }
        if (masteryScore >= 0.4) {
            return 3;
        }
        return 1;
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    public double getMasteryScore() {
        return masteryScore;
    }

    public void setMasteryScore(double masteryScore) {
        this.masteryScore = clamp(masteryScore);
    }
}
