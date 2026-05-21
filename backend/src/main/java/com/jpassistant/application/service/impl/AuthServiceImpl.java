package com.jpassistant.application.service.impl;

import com.jpassistant.application.dto.request.GoogleAccountLinkRequest;
import com.jpassistant.application.dto.request.GoogleOAuth2LoginRequest;
import com.jpassistant.application.dto.request.LoginRequest;
import com.jpassistant.application.dto.request.RefreshTokenRequest;
import com.jpassistant.application.dto.request.RegisterRequest;
import com.jpassistant.application.dto.response.AuthResponse;
import com.jpassistant.application.dto.response.UserResponse;
import com.jpassistant.application.exception.AccountLinkRequiredException;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.service.AuthService;
import com.jpassistant.domain.auth.AuthProvider;
import com.jpassistant.domain.auth.RefreshToken;
import com.jpassistant.domain.auth.User;
import com.jpassistant.domain.auth.UserAuthProvider;
import com.jpassistant.domain.personalization.StudentProfile;
import com.jpassistant.infrastructure.persistence.jpa.RefreshTokenJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.StudentProfileJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.UserAuthProviderJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.UserJpaRepository;
import com.jpassistant.infrastructure.security.JwtTokenProvider;
import io.jsonwebtoken.JwtException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private static final String BAD_CREDENTIALS_MESSAGE = "invalid email or password";

    private final UserJpaRepository userRepository;
    private final UserAuthProviderJpaRepository providerRepository;
    private final RefreshTokenJpaRepository refreshTokenRepository;
    private final StudentProfileJpaRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthServiceImpl(
            UserJpaRepository userRepository,
            UserAuthProviderJpaRepository providerRepository,
            RefreshTokenJpaRepository refreshTokenRepository,
            StudentProfileJpaRepository studentProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new InvalidRequestException("email is already registered");
        }

        User user = userRepository.save(new User(
                email,
                defaultDisplayName(request.displayName(), email),
                optionalText(request.avatarUrl()),
                passwordEncoder.encode(request.password())
        ));
        providerRepository.save(new UserAuthProvider(
                user,
                AuthProvider.LOCAL,
                email,
                email,
                user.getDisplayName(),
                user.getAvatarUrl()
        ));
        syncStudentAvatar(user);
        return issueTokens(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new InvalidRequestException(BAD_CREDENTIALS_MESSAGE));
        ensureActive(user);
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidRequestException(BAD_CREDENTIALS_MESSAGE);
        }
        return issueTokens(user);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        Instant now = Instant.now();
        RefreshToken currentToken = refreshTokenRepository.findByTokenHash(hashToken(request.refreshToken()))
                .orElseThrow(() -> new InvalidRequestException("refresh token is invalid"));
        if (currentToken.isRevoked() || currentToken.isExpired(now)) {
            currentToken.revoke(now);
            throw new InvalidRequestException("refresh token is invalid");
        }
        User user = currentToken.getUser();
        ensureActive(user);
        currentToken.revoke(now);
        return issueTokens(user);
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByTokenHash(hashToken(request.refreshToken()))
                .ifPresent(token -> token.revoke(Instant.now()));
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleOAuth2LoginRequest request) {
        String providerUserId = normalizeRequired(request.providerUserId(), "providerUserId");
        String email = normalizeEmail(request.email());
        if (!request.emailVerified()) {
            throw new InvalidRequestException("Google email must be verified");
        }

        return providerRepository.findByProviderAndProviderUserId(AuthProvider.GOOGLE, providerUserId)
                .map(provider -> loginLinkedGoogleUser(provider, request))
                .orElseGet(() -> registerOrRequireLinkForGoogleUser(request, providerUserId, email));
    }

    @Override
    @Transactional
    public AuthResponse linkGoogleAccount(GoogleAccountLinkRequest request) {
        GoogleOAuth2LoginRequest googleRequest = parseGoogleLinkToken(request.linkToken());
        String providerUserId = normalizeRequired(googleRequest.providerUserId(), "providerUserId");
        String email = normalizeEmail(googleRequest.email());
        if (!googleRequest.emailVerified()) {
            throw new InvalidRequestException("Google email must be verified");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new InvalidRequestException("local account was not found"));
        ensureActive(user);
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidRequestException(BAD_CREDENTIALS_MESSAGE);
        }

        providerRepository.findByProviderAndProviderUserId(AuthProvider.GOOGLE, providerUserId)
                .ifPresent(existingProvider -> {
                    if (!existingProvider.getUser().getId().equals(user.getId())) {
                        throw new InvalidRequestException("Google account is already linked to another user");
                    }
                });
        providerRepository.findByUserIdAndProvider(user.getId(), AuthProvider.GOOGLE)
                .ifPresent(existingProvider -> {
                    throw new InvalidRequestException("local account is already linked to Google");
                });

        seedUserAvatar(user, googleRequest.avatarUrl());
        providerRepository.save(new UserAuthProvider(
                user,
                AuthProvider.GOOGLE,
                providerUserId,
                email,
                defaultDisplayName(googleRequest.displayName(), email),
                optionalText(googleRequest.avatarUrl())
        ));
        syncStudentAvatar(user);
        return issueTokens(user);
    }

    private AuthResponse loginLinkedGoogleUser(
            UserAuthProvider provider,
            GoogleOAuth2LoginRequest request
    ) {
        provider.setDisplayName(optionalText(request.displayName()));
        provider.setAvatarUrl(optionalText(request.avatarUrl()));
        User user = provider.getUser();
        seedUserAvatar(user, request.avatarUrl());
        ensureActive(user);
        syncStudentAvatar(user);
        return issueTokens(user);
    }

    private AuthResponse registerOrRequireLinkForGoogleUser(
            GoogleOAuth2LoginRequest request,
            String providerUserId,
            String email
    ) {
        userRepository.findByEmailIgnoreCase(email)
                .ifPresent(existing -> {
                    throw new AccountLinkRequiredException(existing.getEmail());
                });

        User user = userRepository.save(new User(
                email,
                defaultDisplayName(request.displayName(), email),
                optionalText(request.avatarUrl()),
                null
        ));
        providerRepository.save(new UserAuthProvider(
                user,
                AuthProvider.GOOGLE,
                providerUserId,
                email,
                user.getDisplayName(),
                user.getAvatarUrl()
        ));
        syncStudentAvatar(user);
        return issueTokens(user);
    }

    private GoogleOAuth2LoginRequest parseGoogleLinkToken(String linkToken) {
        try {
            return jwtTokenProvider.parseGoogleAccountLinkToken(normalizeRequired(linkToken, "linkToken"));
        } catch (IllegalArgumentException | JwtException ex) {
            throw new InvalidRequestException("Google account link token is invalid");
        }
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user);
        String refreshToken = generateRefreshToken();
        refreshTokenRepository.save(new RefreshToken(
                user,
                hashToken(refreshToken),
                jwtTokenProvider.refreshTokenExpiresAt()
        ));
        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.accessTokenExpiresInSeconds(),
                toUserResponse(user)
        );
    }

    private void syncStudentAvatar(User user) {
        if (user.getId() == null || user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
            return;
        }
        String userId = user.getId().toString();
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseGet(() -> new StudentProfile(userId));
        if (profile.getAvatarUrl() == null || profile.getAvatarUrl().isBlank()) {
            profile.setAvatarUrl(user.getAvatarUrl());
            studentProfileRepository.save(profile);
        }
    }

    private void seedUserAvatar(User user, String avatarUrl) {
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(optionalText(avatarUrl));
        }
    }

    private void ensureActive(User user) {
        if (!user.isActive()) {
            throw new InvalidRequestException("user account is disabled");
        }
    }

    private String normalizeEmail(String email) {
        return normalizeRequired(email, "email").toLowerCase(Locale.ROOT);
    }

    private String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException(field + " is required");
        }
        return value.trim();
    }

    private String defaultDisplayName(String displayName, String email) {
        String normalized = optionalText(displayName);
        if (normalized != null) {
            return normalized;
        }
        return email.substring(0, email.indexOf('@'));
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getRole().name(),
                user.getStatus().name()
        );
    }
}
