package com.sonrisa.api.dto;

import com.sonrisa.api.entity.NombreRol;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.Set;

public record UsuarioUpdateRequest(
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

        /** Opcional: si se envía, se cambia la contraseña. */
        @Pattern(regexp = Validaciones.PASSWORD, message = Validaciones.PASSWORD_MSG)
        String password,

        @NotEmpty(message = "Selecciona al menos un rol")
        Set<NombreRol> roles,

        @NotNull(message = "Indica si el usuario está activo")
        Boolean activo,

        @Valid
        DatosDentistaRequest datosDentista) {
}
