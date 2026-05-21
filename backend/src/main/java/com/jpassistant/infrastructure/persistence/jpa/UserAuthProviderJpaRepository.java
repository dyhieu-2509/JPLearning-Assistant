package com.jpassistant.infrastructure.persistence.jpa;

import com.jpassistant.domain.auth.AuthProvider;
import com.jpassistant.domain.auth.UserAuthProvider;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAuthProviderJpaRepository extends JpaRepository<UserAuthProvider, UUID> {

    Optional<UserAuthProvider> findByProviderAndProviderUserId(
            AuthProvider provider,
            String providerUserId
    );

    Optional<UserAuthProvider> findByUserIdAndProvider(UUID userId, AuthProvider provider);
}
