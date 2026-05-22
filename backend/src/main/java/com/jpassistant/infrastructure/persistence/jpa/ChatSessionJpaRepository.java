package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.chat.ChatSession;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatSessionJpaRepository extends JpaRepository<ChatSession, UUID> {

    Optional<ChatSession> findByIdAndUserId(UUID id, String userId);

    long countByUserId(String userId);

    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(String userId, Pageable pageable);
}
