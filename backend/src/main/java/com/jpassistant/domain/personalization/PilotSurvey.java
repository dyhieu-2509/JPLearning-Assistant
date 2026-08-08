package com.jpassistant.domain.personalization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pilot_surveys")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PilotSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "context_type", nullable = false, length = 50)
    private String contextType;

    @Column(name = "context_id", length = 200)
    private String contextId;

    @Column(name = "context_title", length = 200)
    private String contextTitle;

    @Column(name = "sus_q1", nullable = false)
    private int susQ1;

    @Column(name = "sus_q2", nullable = false)
    private int susQ2;

    @Column(name = "sus_q3", nullable = false)
    private int susQ3;

    @Column(name = "sus_q4", nullable = false)
    private int susQ4;

    @Column(name = "sus_q5", nullable = false)
    private int susQ5;

    @Column(name = "sus_q6", nullable = false)
    private int susQ6;

    @Column(name = "sus_q7", nullable = false)
    private int susQ7;

    @Column(name = "sus_q8", nullable = false)
    private int susQ8;

    @Column(name = "sus_q9", nullable = false)
    private int susQ9;

    @Column(name = "sus_q10", nullable = false)
    private int susQ10;

    @Column(name = "trust_rating")
    private Integer trustRating;

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public PilotSurvey(
            String userId,
            String contextType,
            String contextId,
            String contextTitle,
            List<Integer> susScores,
            Integer trustRating,
            String comment
    ) {
        this.userId = userId;
        this.contextType = contextType;
        this.contextId = contextId;
        this.contextTitle = contextTitle;
        this.susQ1 = susScores.get(0);
        this.susQ2 = susScores.get(1);
        this.susQ3 = susScores.get(2);
        this.susQ4 = susScores.get(3);
        this.susQ5 = susScores.get(4);
        this.susQ6 = susScores.get(5);
        this.susQ7 = susScores.get(6);
        this.susQ8 = susScores.get(7);
        this.susQ9 = susScores.get(8);
        this.susQ10 = susScores.get(9);
        this.trustRating = trustRating;
        this.comment = comment;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
    }

    public List<Integer> susScores() {
        return List.of(susQ1, susQ2, susQ3, susQ4, susQ5, susQ6, susQ7, susQ8, susQ9, susQ10);
    }

    public double susScore() {
        List<Integer> scores = susScores();
        double adjusted = 0;
        for (int index = 0; index < scores.size(); index += 1) {
            int value = scores.get(index);
            adjusted += index % 2 == 0 ? value - 1 : 5 - value;
        }
        return adjusted * 2.5;
    }
}
