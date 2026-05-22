package com.jpassistant.domain.personalization;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true, length = 100)
    private String userId;

    @Column(name = "current_level", nullable = false, length = 2)
    @Setter
    private String currentLevel = "N5";

    @Column(name = "target_level", nullable = false, length = 2)
    @Setter
    private String targetLevel = "N4";

    @Column(name = "avatar_url", length = 500)
    @Setter
    private String avatarUrl;

    @Column(name = "goal", nullable = false, length = 200)
    @Setter
    private String goal = "JLPT preparation";

    @Column(name = "daily_study_minutes", nullable = false)
    @Setter
    private int dailyStudyMinutes = 30;

    @Column(name = "explanation_style", nullable = false, length = 50)
    @Setter
    private String explanationStyle = "concise";

    @Column(name = "romaji_enabled", nullable = false)
    @Setter
    private boolean romajiEnabled = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "student_profile_weak_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill", nullable = false, length = 50)
    @Setter
    private Set<String> weakSkills = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public StudentProfile(String userId) {
        this.userId = userId;
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
}
