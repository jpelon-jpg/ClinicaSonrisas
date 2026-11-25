package com.sonrisa.api.controller;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.service.ExpedienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** ADMIN consulta; solo el DENTISTA tratante agrega notas y registros (no se editan ni se borran). */
@RestController
@RequestMapping("/api/expedientes/{pacienteId}")
@PreAuthorize("hasAnyRole('ADMIN','DENTISTA')")
@RequiredArgsConstructor
public class ExpedienteController {

    private final ExpedienteService service;

    @GetMapping
    public ExpedienteResponse obtener(@PathVariable Long pacienteId) {
        return service.obtener(pacienteId);
    }

    @PutMapping("/antecedentes")
    @PreAuthorize("hasRole('DENTISTA')")
    public PacienteResponse antecedentes(@PathVariable Long pacienteId, @Valid @RequestBody AntecedentesRequest req) {
        return service.actualizarAntecedentes(pacienteId, req);
    }

    @PostMapping("/notas")
    @PreAuthorize("hasRole('DENTISTA')")
    @ResponseStatus(HttpStatus.CREATED)
    public NotaEvolucionResponse nota(@PathVariable Long pacienteId, @Valid @RequestBody NotaEvolucionRequest req) {
        return service.agregarNota(pacienteId, req);
    }

    @PostMapping("/odontograma")
    @PreAuthorize("hasRole('DENTISTA')")
    @ResponseStatus(HttpStatus.CREATED)
    public OdontogramaResponse odontograma(@PathVariable Long pacienteId, @Valid @RequestBody OdontogramaRequest req) {
        return service.registrarPieza(pacienteId, req);
    }

    @GetMapping("/odontograma/{pieza}/historial")
    public List<OdontogramaResponse> historial(@PathVariable Long pacienteId, @PathVariable Integer pieza) {
        return service.historialPieza(pacienteId, pieza);
    }
}
