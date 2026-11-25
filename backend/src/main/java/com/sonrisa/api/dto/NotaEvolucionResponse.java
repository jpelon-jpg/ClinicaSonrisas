package com.sonrisa.api.dto;

import java.time.LocalDateTime;

public record NotaEvolucionResponse(
        Long id,
        Long citaId,
        String dentista,
        String motivoConsulta,
        String diagnostico,
        String tratamientoRealizado,
        String pronostico,
        String indicaciones,
        LocalDateTime creadoEn) {
}
