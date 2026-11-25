package com.sonrisa.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.Set;

/** Solicitud de cita en línea hecha por el propio paciente (queda PENDIENTE). */
public record CitaPacienteRequest(
        @NotNull(message = "Selecciona un dentista")
        Long dentistaId,

        @NotNull(message = "Selecciona fecha y hora")
        @Future(message = "La cita debe ser en una fecha futura")
        LocalDateTime fechaHora,

        @NotEmpty(message = "Selecciona al menos un tratamiento")
        Set<@NotNull Long> tratamientoIds,

        @Size(max = 255, message = "Máximo 255 caracteres")
        String motivo) {
}
