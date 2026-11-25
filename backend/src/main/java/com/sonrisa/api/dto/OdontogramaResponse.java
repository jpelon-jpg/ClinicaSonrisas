package com.sonrisa.api.dto;

import java.time.LocalDateTime;

public record OdontogramaResponse(Long id, Integer pieza, String estado, String observacion, String dentista, LocalDateTime creadoEn) {
}
