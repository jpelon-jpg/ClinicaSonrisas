package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record PerfilUpdateRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "Máximo 80 caracteres")
        @Pattern(regexp = Validaciones.NOMBRE, message = Validaciones.NOMBRE_MSG)
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 120, message = "Máximo 120 caracteres")
        @Pattern(regexp = Validaciones.NOMBRE, message = Validaciones.NOMBRE_MSG)
        String apellidos,

        @Pattern(regexp = Validaciones.TELEFONO, message = Validaciones.TELEFONO_MSG)
        String telefono,

        @URL(message = "Escribe una URL válida")
        @Size(max = 500, message = "Máximo 500 caracteres")
        String avatarUrl) {
}
