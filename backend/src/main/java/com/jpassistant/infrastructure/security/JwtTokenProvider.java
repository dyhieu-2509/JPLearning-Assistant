package com.jpassistant.infrastructure.security;

import com.jpassistant.application.dto.request.GoogleOAuth2LoginRequest;
import com.jpassistant.config.AuthProperties;
import com.jpassistant.domain.auth.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private static final Duration GOOGLE_LINK_TOKEN_TTL = Duration.ofMinutes(10);
    private static final String GOOGLE_LINK_TOKEN_TYPE = "GOOGLE_ACCOUNT_LINK";

    private final AuthProperties properties;
    private final SecretKey signingKey;

    public JwtTokenProvider(AuthProperties properties) {
        this.properties = properties;
        this.signingKey = Keys.hmacShaKeyFor(properties.jwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(properties.accessTokenTtl());
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public long accessTokenExpiresInSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }

    public String createGoogleAccountLinkToken(GoogleOAuth2LoginRequest request) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(GOOGLE_LINK_TOKEN_TTL);
        return Jwts.builder()
                .subject(request.email())
                .claim("type", GOOGLE_LINK_TOKEN_TYPE)
                .claim("providerUserId", request.providerUserId())
                .claim("email", request.email())
                .claim("emailVerified", request.emailVerified())
                .claim("displayName", request.displayName())
                .claim("avatarUrl", request.avatarUrl())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    public GoogleOAuth2LoginRequest parseGoogleAccountLinkToken(String token) {
        Claims claims = parseClaims(token);
        String type = claims.get("type", String.class);
        if (!GOOGLE_LINK_TOKEN_TYPE.equals(type)) {
            throw new JwtException("invalid Google account link token");
        }
        return new GoogleOAuth2LoginRequest(
                claims.get("providerUserId", String.class),
                claims.get("email", String.class),
                Boolean.TRUE.equals(claims.get("emailVerified", Boolean.class)),
                claims.get("displayName", String.class),
                claims.get("avatarUrl", String.class)
        );
    }

    public Instant refreshTokenExpiresAt() {
        return Instant.now().plus(properties.refreshTokenTtl());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
