package com.sonrisa.api.controller;

import com.sonrisa.api.dto.DashboardDtos.*;
import com.sonrisa.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminDashboard admin() {
        return service.admin();
    }

    @GetMapping("/recepcion")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public RecepcionDashboard recepcion() {
        return service.recepcion();
    }

    @GetMapping("/dentista")
    @PreAuthorize("hasRole('DENTISTA')")
    public DentistaAgenda dentista(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return service.dentista(fecha);
    }

    @GetMapping("/paciente")
    @PreAuthorize("hasRole('PACIENTE')")
    public PacienteResumen paciente() {
        return service.paciente();
    }
}
