package com.jpassistant.application.service;

import com.jpassistant.application.dto.request.GoogleAccountLinkRequest;
import com.jpassistant.application.dto.request.GoogleOAuth2LoginRequest;
import com.jpassistant.application.dto.request.LoginRequest;
import com.jpassistant.application.dto.request.RefreshTokenRequest;
import com.jpassistant.application.dto.request.RegisterRequest;
import com.jpassistant.application.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);

    AuthResponse loginWithGoogle(GoogleOAuth2LoginRequest request);

    AuthResponse linkGoogleAccount(GoogleAccountLinkRequest request);
}
