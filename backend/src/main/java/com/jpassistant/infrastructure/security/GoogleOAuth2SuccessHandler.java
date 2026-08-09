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
            response.sendRedirect(successRedirect(request, authResponse));
        } catch (AccountLinkRequiredException ex) {
            response.sendRedirect(accountLinkRedirect(request, ex.email(), googleRequest));
        } catch (InvalidRequestException ex) {
            response.sendRedirect(errorRedirect(request, "GOOGLE_LOGIN_FAILED", null));
        }
    }

    private String attribute(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? null : value.toString();
    }

    private String successRedirect(HttpServletRequest request, AuthResponse authResponse) {
        return UriComponentsBuilder.fromUriString(frontendRedirectUrl(request))
                .queryParam("accessToken", authResponse.accessToken())
                .queryParam("refreshToken", authResponse.refreshToken())
                .queryParam("expiresIn", authResponse.expiresIn())
                .build()
                .toUriString();
    }

    private String errorRedirect(HttpServletRequest request, String error, String email) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(frontendRedirectUrl(request))
                .queryParam("error", error);
        if (email != null) {
            builder.queryParam("email", email);
        }
        return builder.build().toUriString();
    }

    private String accountLinkRedirect(HttpServletRequest httpRequest, String email, GoogleOAuth2LoginRequest request) {
        return UriComponentsBuilder.fromUriString(frontendRedirectUrl(httpRequest))
                .queryParam("error", "ACCOUNT_LINK_REQUIRED")
                .queryParam("email", email)
                .queryParam("linkToken", jwtTokenProvider.createGoogleAccountLinkToken(request))
                .build()
                .toUriString();
    }

    private String frontendRedirectUrl(HttpServletRequest request) {
        String configured = authProperties.frontendRedirectUrl();
        if (!isLocalhostRedirect(configured)) {
            return configured;
        }

        String host = firstHeaderValue(request, "X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getHeader("Host");
        }
        if (host == null || host.isBlank() || isLocalhostHost(host)) {
            return configured;
        }

        String scheme = firstHeaderValue(request, "X-Forwarded-Proto");
        if (scheme == null || scheme.isBlank()) {
            scheme = request.getScheme();
        }
        return UriComponentsBuilder.newInstance()
                .scheme(scheme)
                .host(hostWithoutPort(host))
                .port(portFromHost(host))
                .path("/auth/callback")
                .build()
                .toUriString();
    }

    private boolean isLocalhostRedirect(String redirectUrl) {
        try {
            String host = UriComponentsBuilder.fromUriString(redirectUrl).build().getHost();
            return host == null || isLocalhostHost(host);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private boolean isLocalhostHost(String host) {
        String lowerHost = hostWithoutPort(host).toLowerCase();
        return "localhost".equals(lowerHost) || "127.0.0.1".equals(lowerHost) || "::1".equals(lowerHost);
    }

    private String firstHeaderValue(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.split(",")[0].trim();
    }

    private String hostWithoutPort(String host) {
        if (host.startsWith("[") && host.contains("]")) {
            return host.substring(1, host.indexOf(']'));
        }
        int colon = host.lastIndexOf(':');
        if (colon > -1 && host.indexOf(':') == colon) {
            return host.substring(0, colon);
        }
        return host;
    }

    private int portFromHost(String host) {
        if (host.startsWith("[") && host.contains("]")) {
            int colon = host.indexOf(':', host.indexOf(']'));
            if (colon > -1) {
                return parsePort(host.substring(colon + 1));
            }
            return -1;
        }
        int colon = host.lastIndexOf(':');
        if (colon > -1 && host.indexOf(':') == colon) {
            return parsePort(host.substring(colon + 1));
        }
        return -1;
    }

    private int parsePort(String port) {
        try {
            return Integer.parseInt(port);
        } catch (NumberFormatException ex) {
            return -1;
        }
    }
}
