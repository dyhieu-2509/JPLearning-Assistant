package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.request.GoogleAccountLinkRequest;
import com.jpassistant.application.dto.request.LoginRequest;
import com.jpassistant.application.dto.request.RefreshTokenRequest;
import com.jpassistant.application.dto.request.RegisterRequest;
import com.jpassistant.application.dto.response.AuthResponse;
import com.jpassistant.application.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/google/link")
    public AuthResponse linkGoogleAccount(@Valid @RequestBody GoogleAccountLinkRequest request) {
        return authService.linkGoogleAccount(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
    }
}
