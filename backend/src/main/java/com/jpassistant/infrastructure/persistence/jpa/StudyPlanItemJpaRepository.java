package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.planner.StudyPlanItem;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyPlanItemJpaRepository extends JpaRepository<StudyPlanItem, UUID> {

    Optional<StudyPlanItem> findByIdAndPlanIdAndPlanUserId(UUID id, UUID planId, String userId);
}
