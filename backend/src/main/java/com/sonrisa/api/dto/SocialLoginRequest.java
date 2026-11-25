package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotBlank;

/** Token emitido por Google (ID token) o Facebook (access token). */
public record SocialLoginRequest(
        @NotBlank(message = "El token del proveedor es obligatorio")
        String token) {
}
