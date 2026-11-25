package com.sonrisa.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CitaResponse(
        Long id,
        PersonaRef paciente,
        DentistaRef dentista,
        LocalDateTime fechaHora,
        LocalDateTime fin,
        Integer duracionMin,
        String estado,
        String origen,
        String motivo,
        String motivoRechazo,
        List<TratamientoRef> tratamientos,
        BigDecimal total,
        LocalDateTime creadoEn) {

    public record PersonaRef(Long id, String nombreCompleto, String email, String telefono, String avatarUrl) {
    }

    public record DentistaRef(Long id, String nombreCompleto, String consultorio) {
    }

    public record TratamientoRef(Long id, String nombre, BigDecimal precio) {
    }
}
