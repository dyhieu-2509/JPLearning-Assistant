package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.flashcard.FlashcardCard;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashcardCardJpaRepository extends JpaRepository<FlashcardCard, UUID> {

    long countByDeckId(UUID deckId);

    long countByDeckUserId(String userId);

    long countByDeckUserIdAndNextReviewAtLessThanEqual(String userId, Instant dueAt);

    List<FlashcardCard> findByDeckIdAndDeckUserIdOrderByCreatedAtAsc(UUID deckId, String userId);

    Optional<FlashcardCard> findByIdAndDeckUserId(UUID id, String userId);

    List<FlashcardCard> findByDeckUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
            String userId,
            Instant dueAt,
            Pageable pageable
    );
}
