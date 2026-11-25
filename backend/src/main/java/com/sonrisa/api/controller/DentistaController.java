package com.sonrisa.api.controller;

import com.sonrisa.api.dto.DatosDentistaRequest;
import com.sonrisa.api.dto.DentistaResponse;
import com.sonrisa.api.dto.DisponibilidadResponse;
import com.sonrisa.api.service.DentistaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Catálogo de dentistas: lo consultan todos los roles (el paciente lo necesita para agendar). */
@RestController
@RequestMapping("/api/dentistas")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class DentistaController {

    private final DentistaService service;

    @GetMapping
    public List<DentistaResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public DentistaResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @GetMapping("/{id}/disponibilidad")
    public DisponibilidadResponse disponibilidad(@PathVariable Long id,
                                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return service.disponibilidad(id, fecha);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DentistaResponse actualizar(@PathVariable Long id, @Valid @RequestBody DatosDentistaRequest req) {
        return service.actualizar(id, req);
    }
}
