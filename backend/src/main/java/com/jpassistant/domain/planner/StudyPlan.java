package com.jpassistant.domain.planner;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "study_plans")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "level", nullable = false, length = 2)
    private String level;

    @Column(name = "target_level", nullable = false, length = 2)
    private String targetLevel;

    @Column(name = "goal", nullable = false, length = 200)
    private String goal;

    @Column(name = "weekly_study_hours", nullable = false)
    private int weeklyStudyHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StudyPlanStatus status = StudyPlanStatus.ACTIVE;

    @Column(name = "context_json", columnDefinition = "text")
    private String contextJson;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<StudyPlanItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public StudyPlan(
            String userId,
            String level,
            String targetLevel,
            String goal,
            int weeklyStudyHours,
            String contextJson
    ) {
        this.userId = userId;
        this.level = level;
        this.targetLevel = targetLevel;
        this.goal = goal;
        this.weeklyStudyHours = weeklyStudyHours;
        this.contextJson = contextJson;
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

    public void addItem(StudyPlanItem item) {
        this.items.add(item);
        item.attachTo(this);
    }

    public long completedItemCount() {
        return items.stream().filter(StudyPlanItem::isCompleted).count();
    }
}
