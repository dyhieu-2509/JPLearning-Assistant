package com.jpassistant.domain.personalization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "study_feedback")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudyFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "moment", nullable = false, length = 30)
    private StudyFeedbackMoment moment;

    @Column(name = "context_type", nullable = false, length = 50)
    private String contextType;

    @Column(name = "context_id", length = 200)
    private String contextId;

    @Column(name = "context_title", length = 200)
    private String contextTitle;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "clarity_rating")
    private Integer clarityRating;

    @Column(name = "trust_rating")
    private Integer trustRating;

    @Column(name = "difficulty_fit", length = 30)
    private String difficultyFit;

    @Column(name = "pace_choice", length = 30)
    private String paceChoice;

    @Column(name = "action_choice", length = 30)
    private String actionChoice;

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public StudyFeedback(
            String userId,
            StudyFeedbackMoment moment,
            String contextType,
            String contextId,
            String contextTitle,
            Integer rating,
            Integer clarityRating,
            Integer trustRating,
            String difficultyFit,
            String paceChoice,
            String actionChoice,
            String comment
    ) {
        this.userId = userId;
        this.moment = moment;
        this.contextType = contextType;
        this.contextId = contextId;
        this.contextTitle = contextTitle;
        this.rating = rating;
        this.clarityRating = clarityRating;
        this.trustRating = trustRating;
        this.difficultyFit = difficultyFit;
        this.paceChoice = paceChoice;
        this.actionChoice = actionChoice;
        this.comment = comment;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
    }
}
