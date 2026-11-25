package com.sonrisa.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Escribe un correo válido")
        String email) {
}
