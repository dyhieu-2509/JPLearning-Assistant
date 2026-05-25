package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.planner.StudyPlan;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyPlanJpaRepository extends JpaRepository<StudyPlan, UUID> {

    Optional<StudyPlan> findByIdAndUserId(UUID id, String userId);

    List<StudyPlan> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
