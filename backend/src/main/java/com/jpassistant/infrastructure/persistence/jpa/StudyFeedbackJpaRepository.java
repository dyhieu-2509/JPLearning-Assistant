package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.personalization.StudyFeedback;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyFeedbackJpaRepository extends JpaRepository<StudyFeedback, UUID> {

    List<StudyFeedback> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
