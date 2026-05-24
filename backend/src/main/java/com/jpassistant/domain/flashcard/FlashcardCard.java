package com.jpassistant.domain.flashcard;

import com.jpassistant.domain.personalization.LearningSignalResult;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "flashcard_cards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FlashcardCard {

    private static final double MIN_EASINESS_FACTOR = 1.3;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deck_id", nullable = false)
    private FlashcardDeck deck;

    @Column(name = "front_text", nullable = false, length = 500)
    private String frontText;

    @Column(name = "back_text", nullable = false, length = 1000)
    private String backText;

    @Column(name = "reading", length = 500)
    private String reading;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    @Column(name = "source_id", nullable = false, length = 200)
    private String sourceId;

    @Column(name = "level", nullable = false, length = 2)
    private String level;

    @Column(name = "easiness_factor", nullable = false)
    private double easinessFactor = 2.5;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays;

    @Column(name = "repetitions", nullable = false)
    private int repetitions;

    @Column(name = "next_review_at", nullable = false)
    private Instant nextReviewAt;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public FlashcardCard(
            FlashcardDeck deck,
            String frontText,
            String backText,
            String reading,
            String sourceType,
            String sourceId,
            String level
    ) {
        this.deck = deck;
        this.frontText = frontText;
        this.backText = backText;
        this.reading = reading;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.level = level;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.nextReviewAt == null) {
            this.nextReviewAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void recordReview(LearningSignalResult rating) {
        Instant now = Instant.now();
        this.lastReviewedAt = now;
        switch (rating) {
            case AGAIN -> {
                this.repetitions = 0;
                this.intervalDays = 1;
                this.easinessFactor = clampEasiness(this.easinessFactor - 0.2);
            }
            case HARD -> {
                this.repetitions = Math.max(1, this.repetitions + 1);
                this.intervalDays = Math.max(2, (int) Math.ceil(Math.max(1, this.intervalDays) * 1.2));
                this.easinessFactor = clampEasiness(this.easinessFactor - 0.15);
            }
            case GOOD -> {
                this.repetitions++;
                this.intervalDays = nextGoodInterval();
            }
            case EASY -> {
                this.repetitions++;
                this.intervalDays = nextEasyInterval();
                this.easinessFactor = clampEasiness(this.easinessFactor + 0.15);
            }
            case CORRECT, WRONG -> throw new IllegalArgumentException("flashcard rating is required");
        }
        this.nextReviewAt = now.plus(Duration.ofDays(this.intervalDays));
        this.updatedAt = now;
        this.deck.touch();
    }

    private int nextGoodInterval() {
        if (this.repetitions == 1) {
            return 1;
        }
        if (this.repetitions == 2) {
            return 3;
        }
        return Math.max(1, (int) Math.ceil(Math.max(1, this.intervalDays) * this.easinessFactor));
    }

    private int nextEasyInterval() {
        if (this.repetitions == 1) {
            return 4;
        }
        return Math.max(4, (int) Math.ceil(Math.max(1, this.intervalDays) * this.easinessFactor * 1.3));
    }

    private double clampEasiness(double value) {
        return Math.max(MIN_EASINESS_FACTOR, value);
    }
}
