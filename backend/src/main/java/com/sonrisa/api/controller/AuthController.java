package com.sonrisa.api.controller;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.security.JwtAuthenticationFilter;
import com.sonrisa.api.service.AuthService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.registrar(req);
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody SocialLoginRequest req) {
        return authService.loginGoogle(req);
    }

    @PostMapping("/facebook")
    public AuthResponse facebook(@Valid @RequestBody SocialLoginRequest req) {
        return authService.loginFacebook(req);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public MensajeResponse logout(HttpServletRequest request) {
        authService.logout((Claims) request.getAttribute(JwtAuthenticationFilter.ATTR_CLAIMS));
        return new MensajeResponse("Sesión cerrada");
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UsuarioResponse me() {
        return authService.me();
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public MensajeResponse changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        return authService.cambiarPassword(req);
    }

    @PostMapping("/forgot-password")
    public MensajeResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        return authService.olvidePassword(req);
    }

    @PostMapping("/reset-password")
    public MensajeResponse resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        return authService.restablecerPassword(req);
    }
}
