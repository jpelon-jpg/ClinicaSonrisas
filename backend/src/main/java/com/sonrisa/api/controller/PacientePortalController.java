package com.sonrisa.api.controller;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.dto.DashboardDtos.PacienteResumen;
import com.sonrisa.api.entity.EstadoCita;
import com.sonrisa.api.service.CitaService;
import com.sonrisa.api.service.DashboardService;
import com.sonrisa.api.service.ExpedienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Portal del paciente: solo opera sobre sus propios datos. */
@RestController
@RequestMapping("/api/paciente")
@PreAuthorize("hasRole('PACIENTE')")
@RequiredArgsConstructor
public class PacientePortalController {

    private final CitaService citaService;
    private final ExpedienteService expedienteService;
    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public PacienteResumen resumen() {
        return dashboardService.paciente();
    }

    /** tipo = proximas | historial */
    @GetMapping("/citas")
    public PageResponse<CitaResponse> misCitas(@RequestParam(defaultValue = "proximas") String tipo,
                                               @RequestParam(required = false) EstadoCita estado,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return citaService.misCitasPaciente(tipo, estado, page, size);
    }

    @PostMapping("/citas")
    @ResponseStatus(HttpStatus.CREATED)
    public CitaResponse solicitar(@Valid @RequestBody CitaPacienteRequest req) {
        return citaService.solicitar(req);
    }

    @PatchMapping("/citas/{id}/cancelar")
    public CitaResponse cancelar(@PathVariable Long id, @Valid @RequestBody MotivoRequest req) {
        return citaService.cancelarPorPaciente(id, req.motivo());
    }

    @GetMapping("/expediente")
    public ExpedienteResponse expediente() {
        return expedienteService.propio();
    }
}
