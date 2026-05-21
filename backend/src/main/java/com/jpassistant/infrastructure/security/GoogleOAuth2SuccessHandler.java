package com.jpassistant.infrastructure.security;

import com.jpassistant.application.dto.request.GoogleOAuth2LoginRequest;
import com.jpassistant.application.dto.response.AuthResponse;
import com.jpassistant.application.exception.AccountLinkRequiredException;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.service.AuthService;
import com.jpassistant.config.AuthProperties;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final AuthProperties authProperties;
    private final JwtTokenProvider jwtTokenProvider;

    public GoogleOAuth2SuccessHandler(
            AuthService authService,
            AuthProperties authProperties,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.authService = authService;
        this.authProperties = authProperties;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = principal.getAttributes();
        GoogleOAuth2LoginRequest googleRequest = new GoogleOAuth2LoginRequest(
                attribute(attributes, "sub"),
                attribute(attributes, "email"),
                Boolean.TRUE.equals(attributes.get("email_verified")),
                attribute(attributes, "name"),
                attribute(attributes, "picture")
        );
        try {
            AuthResponse authResponse = authService.loginWithGoogle(googleRequest);
            response.sendRedirect(successRedirect(authResponse));
        } catch (AccountLinkRequiredException ex) {
            response.sendRedirect(accountLinkRedirect(ex.email(), googleRequest));
        } catch (InvalidRequestException ex) {
            response.sendRedirect(errorRedirect("GOOGLE_LOGIN_FAILED", null));
        }
    }

    private String attribute(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? null : value.toString();
    }

    private String successRedirect(AuthResponse authResponse) {
        return UriComponentsBuilder.fromUriString(authProperties.frontendRedirectUrl())
                .queryParam("accessToken", authResponse.accessToken())
                .queryParam("refreshToken", authResponse.refreshToken())
                .queryParam("expiresIn", authResponse.expiresIn())
                .build()
                .toUriString();
    }

    private String errorRedirect(String error, String email) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(authProperties.frontendRedirectUrl())
                .queryParam("error", error);
        if (email != null) {
            builder.queryParam("email", email);
        }
        return builder.build().toUriString();
    }

    private String accountLinkRedirect(String email, GoogleOAuth2LoginRequest request) {
        return UriComponentsBuilder.fromUriString(authProperties.frontendRedirectUrl())
                .queryParam("error", "ACCOUNT_LINK_REQUIRED")
                .queryParam("email", email)
                .queryParam("linkToken", jwtTokenProvider.createGoogleAccountLinkToken(request))
                .build()
                .toUriString();
    }
}
