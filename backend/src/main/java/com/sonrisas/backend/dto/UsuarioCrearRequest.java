package com.sonrisas.backend.dto;

import jakarta.validation.constraints.*;

public record UsuarioCrearRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede pasar de 80 caracteres")
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden pasar de 100 caracteres")
        String apellidos,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        String correo,

        @Pattern(regexp = "^$|^\\d{10}$", message = "El teléfono debe tener 10 dígitos")
        String telefono,

        @NotBlank(message = "La contraseña es obligatoria")
        @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial")
        String password,

        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "ADMINISTRADOR|RECEPCIONISTA|DENTISTA|PACIENTE", message = "Rol no válido")
        String rol
) {}