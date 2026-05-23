package com.jpassistant.domain.assessment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "assessment_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssessmentSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "level", nullable = false, length = 2)
    private String level;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "questions_json", nullable = false, columnDefinition = "text")
    private String questionsJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AssessmentSessionStatus status = AssessmentSessionStatus.STARTED;

    @Column(name = "score")
    private Integer score;

    @Column(name = "total_questions", nullable = false)
    private int totalQuestions;

    @Column(name = "answers_json", columnDefinition = "text")
    private String answersJson;

    @Column(name = "weak_areas_json", columnDefinition = "text")
    private String weakAreasJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    public AssessmentSession(
            String userId,
            String level,
            String category,
            String questionsJson,
            int totalQuestions
    ) {
        this.userId = userId;
        this.level = level;
        this.category = category;
        this.questionsJson = questionsJson;
        this.totalQuestions = totalQuestions;
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

    public boolean isSubmitted() {
        return status == AssessmentSessionStatus.SUBMITTED;
    }

    public void submit(int score, String answersJson, String weakAreasJson) {
        this.status = AssessmentSessionStatus.SUBMITTED;
        this.score = score;
        this.answersJson = answersJson;
        this.weakAreasJson = weakAreasJson;
        this.submittedAt = Instant.now();
        this.updatedAt = this.submittedAt;
    }
}
