package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.assessment.AssessmentSession;
import com.jpassistant.domain.assessment.AssessmentSessionStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentSessionJpaRepository extends JpaRepository<AssessmentSession, UUID> {

    Optional<AssessmentSession> findByIdAndUserId(UUID id, String userId);

    long countByUserIdAndStatus(String userId, AssessmentSessionStatus status);

    List<AssessmentSession> findByUserIdAndStatusOrderBySubmittedAtDesc(
            String userId,
            AssessmentSessionStatus status,
            Pageable pageable
    );
}
