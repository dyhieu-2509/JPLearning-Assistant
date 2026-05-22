package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.chat.ChatMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageJpaRepository extends JpaRepository<ChatMessage, UUID> {

    long countBySessionUserId(String userId);

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId, Pageable pageable);
}
