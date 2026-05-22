package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.personalization.StudentProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileJpaRepository extends JpaRepository<StudentProfile, UUID> {

    Optional<StudentProfile> findByUserId(String userId);
}
