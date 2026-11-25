package com.sonrisa.api.dto;

import java.time.LocalTime;

public record DentistaResponse(
        Long id,
        Long usuarioId,
        String nombreCompleto,
        String email,
        String telefono,
        String avatarUrl,
        String especialidad,
        String cedulaProfesional,
        String consultorio,
        LocalTime horaInicio,
        LocalTime horaFin,
        boolean activo) {
}
