package com.sonrisas.backend.dto;

import jakarta.validation.constraints.*;

public record UsuarioActualizarRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede pasar de 80 caracteres")
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden pasar de 100 caracteres")
        String apellidos,

        @Pattern(regexp = "^$|^\\d{10}$", message = "El teléfono debe tener 10 dígitos")
        String telefono
) {}