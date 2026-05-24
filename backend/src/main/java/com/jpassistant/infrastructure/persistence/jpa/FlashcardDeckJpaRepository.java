package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.flashcard.FlashcardDeck;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashcardDeckJpaRepository extends JpaRepository<FlashcardDeck, UUID> {

    List<FlashcardDeck> findByUserIdOrderByUpdatedAtDesc(String userId);

    Optional<FlashcardDeck> findByIdAndUserId(UUID id, String userId);
}
