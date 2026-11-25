package com.sonrisa.api.dto;

import java.time.LocalDate;

public record PacienteResponse(
        Long id,
        Long usuarioId,
        String nombre,
        String apellidos,
        String nombreCompleto,
        String email,
        String telefono,
        String avatarUrl,
        String acceso,
        boolean activo,
        LocalDate fechaNacimiento,
        Integer edad,
        String alergias,
        String antecedentes,
        String contactoEmergencia) {
}
