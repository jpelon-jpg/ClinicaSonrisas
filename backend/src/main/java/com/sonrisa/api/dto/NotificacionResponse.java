package com.sonrisa.api.dto;

import java.time.LocalDateTime;

public record NotificacionResponse(Long id, String canal, String destino, String asunto, String estado, String error,
                                   Long citaId, LocalDateTime creadoEn) {
}
