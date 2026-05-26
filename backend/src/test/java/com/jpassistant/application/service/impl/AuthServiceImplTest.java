package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.jpassistant.application.dto.request.GoogleAccountLinkRequest;
import com.jpassistant.application.dto.request.GoogleOAuth2LoginRequest;
import com.jpassistant.application.dto.request.RegisterRequest;
import com.jpassistant.application.exception.AccountLinkRequiredException;
import com.jpassistant.config.AuthProperties;
import com.jpassistant.domain.auth.AuthProvider;
import com.jpassistant.domain.auth.User;
import com.jpassistant.domain.auth.UserAuthProvider;
import com.jpassistant.infrastructure.persistence.jpa.RefreshTokenJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudentProfileJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.UserAuthProviderJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.UserJpaRepository;
import com.jpassistant.infrastructure.security.JwtTokenProvider;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class AuthServiceImplTest {

    private static final String PASSWORD = "Password123!";

    private final UserJpaRepository userRepository = org.mockito.Mockito.mock(UserJpaRepository.class);
    private final UserAuthProviderJpaRepository providerRepository = org.mockito.Mockito.mock(
            UserAuthProviderJpaRepository.class
    );
    private final RefreshTokenJpaRepository refreshTokenRepository = org.mockito.Mockito.mock(
            RefreshTokenJpaRepository.class
    );
    private final StudentProfileJpaRepository studentProfileRepository = org.mockito.Mockito.mock(
            StudentProfileJpaRepository.class
    );
    private final JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(new AuthProperties(
            "test-secret-change-me-32-bytes-minimum-for-hs256",
            Duration.ofMinutes(30),
            Duration.ofDays(14),
            "http://localhost:3000/auth/callback"
    ));
    private final AuthServiceImpl service = new AuthServiceImpl(
            userRepository,
            providerRepository,
            refreshTokenRepository,
            studentProfileRepository,
            new BCryptPasswordEncoder(),
            jwtTokenProvider
    );

    @Test
    void registerCreatesLocalUserProviderAndJwtTokens() {
        when(userRepository.existsByEmailIgnoreCase("student@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> withId(invocation.getArgument(0)));
        when(studentProfileRepository.findByUserId(anyString())).thenReturn(Optional.empty());

        var response = service.register(new RegisterRequest(
                " Student@Example.com ",
                "password123",
                " Student One ",
                " https://cdn.example.com/avatar.png "
        ));

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.refreshToken()).isNotBlank();
        assertThat(response.expiresIn()).isEqualTo(1800);
        assertThat(response.user().email()).isEqualTo("student@example.com");
        assertThat(response.user().displayName()).isEqualTo("Student One");
        assertThat(response.user().avatarUrl()).isEqualTo("https://cdn.example.com/avatar.png");

        ArgumentCaptor<UserAuthProvider> providerCaptor = ArgumentCaptor.forClass(UserAuthProvider.class);
        verify(providerRepository).save(providerCaptor.capture());
        assertThat(providerCaptor.getValue().getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(providerCaptor.getValue().getProviderUserId()).isEqualTo("student@example.com");
    }

    @Test
    void googleLoginRequiresExplicitLinkWhenEmailMatchesLocalUser() {
        User existing = withId(new User(
                "student@example.com",
                "Student One",
                null,
                "hashed-password"
        ));
        when(providerRepository.findByProviderAndProviderUserId(AuthProvider.GOOGLE, "google-sub"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.loginWithGoogle(new GoogleOAuth2LoginRequest(
                "google-sub",
                "Student@Example.com",
                true,
                "Student One",
                "https://cdn.example.com/google-avatar.png"
        ))).isInstanceOf(AccountLinkRequiredException.class)
                .hasMessageContaining("student@example.com");
    }

    @Test
    void linkGoogleAccountCreatesProviderAfterPasswordConfirmation() {
        String passwordHash = new BCryptPasswordEncoder().encode(PASSWORD);
        User existing = withId(new User(
                "student@example.com",
                "Student One",
                null,
                passwordHash
        ));
        GoogleOAuth2LoginRequest googleRequest = new GoogleOAuth2LoginRequest(
                "google-sub",
                "student@example.com",
                true,
                "Google Name",
                "https://cdn.example.com/google-avatar.png"
        );
        String linkToken = jwtTokenProvider.createGoogleAccountLinkToken(googleRequest);

        when(userRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.of(existing));
        when(providerRepository.findByProviderAndProviderUserId(AuthProvider.GOOGLE, "google-sub"))
                .thenReturn(Optional.empty());
        when(providerRepository.findByUserIdAndProvider(existing.getId(), AuthProvider.GOOGLE))
                .thenReturn(Optional.empty());
        when(studentProfileRepository.findByUserId(existing.getId().toString())).thenReturn(Optional.empty());

        var response = service.linkGoogleAccount(new GoogleAccountLinkRequest(linkToken, PASSWORD));

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.refreshToken()).isNotBlank();
        assertThat(response.user().email()).isEqualTo("student@example.com");
        assertThat(response.user().avatarUrl()).isEqualTo("https://cdn.example.com/google-avatar.png");

        ArgumentCaptor<UserAuthProvider> providerCaptor = ArgumentCaptor.forClass(UserAuthProvider.class);
        verify(providerRepository).save(providerCaptor.capture());
        assertThat(providerCaptor.getValue().getProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(providerCaptor.getValue().getProviderUserId()).isEqualTo("google-sub");
    }

    private User withId(User user) {
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        return user;
    }
}
