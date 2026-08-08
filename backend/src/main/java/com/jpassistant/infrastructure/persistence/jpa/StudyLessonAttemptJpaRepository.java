package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.personalization.StudyLessonAttempt;
import com.jpassistant.domain.personalization.StudyLessonAttemptStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyLessonAttemptJpaRepository extends JpaRepository<StudyLessonAttempt, UUID> {

    Optional<StudyLessonAttempt> findByIdAndUserId(UUID id, String userId);

    List<StudyLessonAttempt> findByUserIdOrderByStartedAtDesc(String userId);

    List<StudyLessonAttempt> findByStatusOrderBySubmittedAtDesc(StudyLessonAttemptStatus status);
}
