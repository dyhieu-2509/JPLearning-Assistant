package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.personalization.KnowledgeProgress;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KnowledgeProgressJpaRepository extends JpaRepository<KnowledgeProgress, UUID> {

    Optional<KnowledgeProgress> findByUserIdAndKnowledgeTypeAndKnowledgeId(
            String userId,
            String knowledgeType,
            String knowledgeId
    );

    List<KnowledgeProgress> findByUserIdOrderByMasteryScoreAscUpdatedAtDesc(String userId, Pageable pageable);

    long countByUserId(String userId);

    long countByUserIdAndMasteryScoreGreaterThanEqual(String userId, double masteryThreshold);

    long countByUserIdAndMasteryScoreLessThan(String userId, double masteryThreshold);

    List<KnowledgeProgress> findByUserIdAndMasteryScoreLessThanOrderByMasteryScoreAscUpdatedAtDesc(
            String userId,
            double masteryThreshold,
            Pageable pageable
    );

    @Query("select coalesce(avg(progress.masteryScore), 0) from KnowledgeProgress progress "
            + "where progress.userId = :userId")
    double averageMasteryScoreByUserId(@Param("userId") String userId);
}
