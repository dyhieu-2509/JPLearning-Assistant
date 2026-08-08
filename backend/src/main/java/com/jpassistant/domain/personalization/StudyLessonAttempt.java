package com.jpassistant.domain.personalization;

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
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "study_lesson_attempts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudyLessonAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "lesson_id", nullable = false, length = 100)
    private String lessonId;

    @Column(name = "lesson_title", length = 200)
    private String lessonTitle;

    @Column(name = "level", length = 10)
    private String level;

    @Column(name = "chapter_id", length = 100)
    private String chapterId;

    @Column(name = "chapter_title", length = 200)
    private String chapterTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StudyLessonAttemptStatus status = StudyLessonAttemptStatus.STARTED;

    @Column(name = "score_percent")
    private Integer scorePercent;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "passed")
    private Boolean passed;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public StudyLessonAttempt(
            String userId,
            String lessonId,
            String lessonTitle,
            String level,
            String chapterId,
            String chapterTitle
    ) {
        this.userId = userId;
        this.lessonId = lessonId;
        this.lessonTitle = lessonTitle;
        this.level = level;
        this.chapterId = chapterId;
        this.chapterTitle = chapterTitle;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.startedAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void complete(int scorePercent, int correctCount, int totalQuestions, boolean passed) {
        this.status = StudyLessonAttemptStatus.COMPLETED;
        this.scorePercent = scorePercent;
        this.correctCount = correctCount;
        this.totalQuestions = totalQuestions;
        this.passed = passed;
        this.submittedAt = Instant.now();
        this.updatedAt = this.submittedAt;
    }

    public Long durationSeconds() {
        if (startedAt == null || submittedAt == null) {
            return null;
        }
        return Duration.between(startedAt, submittedAt).toSeconds();
    }
}
