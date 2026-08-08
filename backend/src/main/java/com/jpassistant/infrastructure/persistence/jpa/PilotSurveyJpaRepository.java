package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.personalization.PilotSurvey;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PilotSurveyJpaRepository extends JpaRepository<PilotSurvey, UUID> {

    List<PilotSurvey> findByUserIdOrderByCreatedAtDesc(String userId);
}
