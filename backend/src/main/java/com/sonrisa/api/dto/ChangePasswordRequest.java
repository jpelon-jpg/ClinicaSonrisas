package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangePasswordRequest(
        @NotBlank(message = "Escribe tu contraseña actual")
        String passwordActual,

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Pattern(regexp = Validaciones.PASSWORD, message = Validaciones.PASSWORD_MSG)
        String passwordNueva) {
}
