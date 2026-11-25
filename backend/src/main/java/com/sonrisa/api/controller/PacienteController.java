package com.sonrisa.api.controller;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.service.PacienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pacientes")
@PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
@RequiredArgsConstructor
public class PacienteController {

    private final PacienteService service;

    /** acceso = CORREO | GOOGLE | FACEBOOK | SIN_ACCESO */
    @GetMapping
    public PageResponse<PacienteResponse> listar(@RequestParam(required = false) String q,
                                                 @RequestParam(required = false) String acceso,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size,
                                                 @RequestParam(required = false) String sort) {
        return service.listar(q, acceso, page, size, sort);
    }

    @GetMapping("/{id}")
    public PacienteResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PacienteCreadoResponse crear(@Valid @RequestBody PacienteRequest req) {
        return service.crear(req);
    }

    @PutMapping("/{id}")
    public PacienteResponse actualizar(@PathVariable Long id, @Valid @RequestBody PacienteRequest req) {
        return service.actualizar(id, req);
    }

    @PostMapping("/{id}/acceso")
    public PacienteCreadoResponse generarAcceso(@PathVariable Long id) {
        return service.generarAcceso(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}
