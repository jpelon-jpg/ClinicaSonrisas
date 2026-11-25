package com.sonrisas.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record DashboardDto(
        ResumenDto resumen,
        List<SemanaDto> citasPorSemana,
        List<OcupacionDentistaDto> ocupacionDentistas,
        List<ActividadDto> actividadReciente
) {
    public record ResumenDto(long citasDelMes, double variacionCitasPct,
                             double ocupacionAgendaPct, double cancelacionesPct,
                             long cancelacionesTotal, long pacientesNuevos) {}

    public record SemanaDto(String etiqueta, long atendidas, long canceladas) {}

    public record OcupacionDentistaDto(String nombre, String consultorio, double porcentaje) {}

    public record ActividadDto(String texto, LocalDateTime fecha) {}
}