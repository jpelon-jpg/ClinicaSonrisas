package com.sonrisa.api.dto;

import jakarta.validation.constraints.*;

/** Auto-registro de pacientes desde el login. */
public record RegisterRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "Máximo 80 caracteres")
        @Pattern(regexp = Validaciones.NOMBRE, message = Validaciones.NOMBRE_MSG)
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 120, message = "Máximo 120 caracteres")
        @Pattern(regexp = Validaciones.NOMBRE, message = Validaciones.NOMBRE_MSG)
        String apellidos,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Escribe un correo válido")
        @Size(max = 150, message = "Máximo 150 caracteres")
        String email,

        @Pattern(regexp = Validaciones.TELEFONO, message = Validaciones.TELEFONO_MSG)
        String telefono,

        @NotBlank(message = "La contraseña es obligatoria")
        @Pattern(regexp = Validaciones.PASSWORD, message = Validaciones.PASSWORD_MSG)
        String password) {
}
