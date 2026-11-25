package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequest(
        @NotBlank(message = "El enlace de recuperación no es válido")
        String token,

        @NotBlank(message = "La contraseña es obligatoria")
        @Pattern(regexp = Validaciones.PASSWORD, message = Validaciones.PASSWORD_MSG)
        String password) {
}
