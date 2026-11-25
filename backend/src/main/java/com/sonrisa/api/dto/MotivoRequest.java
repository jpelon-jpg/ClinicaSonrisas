package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Motivo obligatorio para rechazar o cancelar una cita. */
public record MotivoRequest(
        @NotBlank(message = "Escribe el motivo")
        @Size(min = 5, max = 255, message = "El motivo debe tener entre 5 y 255 caracteres")
        String motivo) {
}
