package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotaEvolucionRequest(
        Long citaId,

        @NotBlank(message = "El motivo de consulta es obligatorio")
        @Size(max = 255, message = "Máximo 255 caracteres")
        String motivoConsulta,

        @NotBlank(message = "El diagnóstico es obligatorio")
        @Size(min = 5, max = 4000, message = "El diagnóstico debe tener entre 5 y 4000 caracteres")
        String diagnostico,

        @NotBlank(message = "Describe el tratamiento realizado")
        @Size(min = 5, max = 4000, message = "Debe tener entre 5 y 4000 caracteres")
        String tratamientoRealizado,

        @Size(max = 255, message = "Máximo 255 caracteres")
        String pronostico,

        @Size(max = 4000, message = "Máximo 4000 caracteres")
        String indicaciones) {
}
