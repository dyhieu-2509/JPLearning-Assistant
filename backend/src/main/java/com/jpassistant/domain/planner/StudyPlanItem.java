package com.jpassistant.domain.planner;

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
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "study_plan_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudyPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private StudyPlan plan;

    @Column(name = "item_order", nullable = false)
    private int itemOrder;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "objective", nullable = false, length = 1200)
    private String objective;

    @Column(name = "estimated_hours", nullable = false)
    private double estimatedHours;

    @Column(name = "completed", nullable = false)
    private boolean completed;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public StudyPlanItem(int itemOrder, String title, String objective, double estimatedHours) {
        this.itemOrder = itemOrder;
        this.title = title;
        this.objective = objective;
        this.estimatedHours = estimatedHours;
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

    void attachTo(StudyPlan plan) {
        this.plan = plan;
    }

    public void markCompleted() {
        if (!completed) {
            this.completed = true;
            this.completedAt = Instant.now();
            this.updatedAt = this.completedAt;
        }
    }
}
