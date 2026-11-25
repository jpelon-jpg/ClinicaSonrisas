package com.sonrisa.api.controller;

import com.sonrisa.api.dto.PageResponse;
import com.sonrisa.api.dto.TratamientoRequest;
import com.sonrisa.api.dto.TratamientoResponse;
import com.sonrisa.api.service.TratamientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tratamientos")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class TratamientoController {

    private final TratamientoService service;

    @GetMapping
    public PageResponse<TratamientoResponse> listar(@RequestParam(required = false) String q,
                                                    @RequestParam(required = false) Boolean activo,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size,
                                                    @RequestParam(required = false) String sort) {
        return service.listar(q, activo, page, size, sort);
    }

    @GetMapping("/activos")
    public List<TratamientoResponse> activos() {
        return service.activos();
    }

    @GetMapping("/{id}")
    public TratamientoResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TratamientoResponse crear(@Valid @RequestBody TratamientoRequest req) {
        return service.crear(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TratamientoResponse actualizar(@PathVariable Long id, @Valid @RequestBody TratamientoRequest req) {
        return service.actualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}
