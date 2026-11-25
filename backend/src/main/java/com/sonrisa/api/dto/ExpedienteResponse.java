package com.sonrisa.api.dto;

import java.util.List;

public record ExpedienteResponse(
        PacienteResponse paciente,
        List<OdontogramaResponse> odontograma,
        List<NotaEvolucionResponse> notas,
        List<CitaResponse> citas) {
}
