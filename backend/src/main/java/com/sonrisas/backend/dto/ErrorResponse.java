package com.sonrisas.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
        int status,
        String error,
        String mensaje,
        Map<String, String> campos,
        LocalDateTime fecha
) {
    public static ErrorResponse of(int status, String error, String mensaje) {
        return new ErrorResponse(status, error, mensaje, null, LocalDateTime.now());
    }
}