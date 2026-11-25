package com.sonrisa.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Alta y edición de pacientes por recepción o administración. */
public record PacienteRequest(
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

        @NotBlank(message = "El teléfono es obligatorio")
        @Pattern(regexp = Validaciones.TELEFONO, message = Validaciones.TELEFONO_MSG)
        String telefono,

        @Past(message = "La fecha de nacimiento debe ser anterior a hoy")
        LocalDate fechaNacimiento,

        @Size(max = 255, message = "Máximo 255 caracteres")
        String alergias,

        @Size(max = 2000, message = "Máximo 2000 caracteres")
        String antecedentes,

        @Size(max = 150, message = "Máximo 150 caracteres")
        String contactoEmergencia,

        /** Si es true, se genera una contraseña temporal y se envía por correo. */
        boolean crearAcceso) {
}
