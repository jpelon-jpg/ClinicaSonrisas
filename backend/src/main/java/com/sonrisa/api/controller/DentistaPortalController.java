package com.sonrisa.api.controller;

import com.sonrisa.api.dto.CitaResponse;
import com.sonrisa.api.dto.DashboardDtos.DentistaAgenda;
import com.sonrisa.api.dto.PacienteResponse;
import com.sonrisa.api.dto.PageResponse;
import com.sonrisa.api.entity.EstadoCita;
import com.sonrisa.api.service.CitaService;
import com.sonrisa.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dentista")
@PreAuthorize("hasRole('DENTISTA')")
@RequiredArgsConstructor
public class DentistaPortalController {

    private final DashboardService dashboardService;
    private final CitaService citaService;

    @GetMapping("/agenda")
    public DentistaAgenda agenda(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return dashboardService.dentista(fecha);
    }

    @GetMapping("/citas")
    public PageResponse<CitaResponse> citas(@RequestParam(required = false) String q,
                                            @RequestParam(required = false) EstadoCita estado,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        return citaService.misCitasDentista(q, estado, desde, hasta, page, size);
    }

    @GetMapping("/pacientes")
    public PageResponse<PacienteResponse> pacientes(@RequestParam(required = false) String q,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        return dashboardService.pacientesDentista(q, page, size);
    }
}
