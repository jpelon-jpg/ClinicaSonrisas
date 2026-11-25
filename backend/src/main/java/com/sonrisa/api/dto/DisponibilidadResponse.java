package com.sonrisa.api.dto;

import java.time.LocalDate;
import java.util.List;

public record DisponibilidadResponse(Long dentistaId, LocalDate fecha, List<String> horariosLibres, List<String> horariosOcupados) {
}
