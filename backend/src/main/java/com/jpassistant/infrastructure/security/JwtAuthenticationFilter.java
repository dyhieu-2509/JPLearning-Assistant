package com.jpassistant.infrastructure.security;

import com.jpassistant.infrastructure.persistence.jpa.UserJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.RefreshTokenJpaRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final UserJpaRepository userRepository;
    private final RefreshTokenJpaRepository refreshTokenRepository;

    public JwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            UserJpaRepository userRepository,
            RefreshTokenJpaRepository refreshTokenRepository
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticate(token);
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(String token) {
        try {
            var userId = jwtTokenProvider.extractUserId(token);
            var sessionId = jwtTokenProvider.extractSessionId(token);
            boolean sessionActive = refreshTokenRepository.findByIdAndUser_Id(sessionId, userId)
                    .filter(refreshToken -> !refreshToken.isRevoked())
                    .filter(refreshToken -> !refreshToken.isExpired(Instant.now()))
                    .isPresent();
            if (!sessionActive) {
                SecurityContextHolder.clearContext();
                return;
            }
            userRepository.findById(userId)
                    .filter(user -> user.isActive())
                    .ifPresent(user -> {
                        var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                        var authentication = new UsernamePasswordAuthenticationToken(
                                user.getId().toString(),
                                null,
                                List.of(authority)
                        );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
        } catch (IllegalArgumentException | JwtException ignored) {
            SecurityContextHolder.clearContext();
        }
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(header) || !header.startsWith(BEARER_PREFIX)) {
            return null;
        }
        return header.substring(BEARER_PREFIX.length());
    }
}
