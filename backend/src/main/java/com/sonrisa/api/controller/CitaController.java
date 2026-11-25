package com.sonrisa.api.controller;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.EstadoCita;
import com.sonrisa.api.entity.OrigenCita;
import com.sonrisa.api.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService service;

    /** Filtros y paginación se resuelven en el servidor. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public PageResponse<CitaResponse> listar(@RequestParam(required = false) String q,
                                             @RequestParam(required = false) EstadoCita estado,
                                             @RequestParam(required = false) Long dentistaId,
                                             @RequestParam(required = false) Long pacienteId,
                                             @RequestParam(required = false) OrigenCita origen,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "10") int size,
                                             @RequestParam(required = false) String sort) {
        return service.listar(q, estado, dentistaId, pacienteId, origen, desde, hasta, page, size, sort);
    }

    /** Cualquier rol autenticado; el servicio verifica que la cita le pertenezca. */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public CitaResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @ResponseStatus(HttpStatus.CREATED)
    public CitaResponse crear(@Valid @RequestBody CitaRequest req) {
        return service.crear(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public CitaResponse actualizar(@PathVariable Long id, @Valid @RequestBody CitaRequest req) {
        return service.actualizar(id, req);
    }

    @PatchMapping("/{id}/confirmar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public CitaResponse confirmar(@PathVariable Long id) {
        return service.confirmar(id);
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public CitaResponse rechazar(@PathVariable Long id, @Valid @RequestBody MotivoRequest req) {
        return service.rechazar(id, req.motivo());
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public CitaResponse cancelar(@PathVariable Long id, @Valid @RequestBody MotivoRequest req) {
        return service.cancelar(id, req.motivo());
    }

    @PatchMapping("/{id}/atender")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','DENTISTA')")
    public CitaResponse atender(@PathVariable Long id) {
        return service.marcarAtendida(id);
    }

    @PatchMapping("/{id}/no-asistio")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA','DENTISTA')")
    public CitaResponse noAsistio(@PathVariable Long id) {
        return service.marcarNoAsistio(id);
    }

    @PostMapping("/{id}/recordatorio")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    public CitaResponse recordatorio(@PathVariable Long id) {
        return service.enviarRecordatorio(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}
