package com.sonrisas.backend.controller;

import com.sonrisas.backend.dto.*;
import com.sonrisas.backend.service.UsuarioAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/usuarios")
@PreAuthorize("hasAuthority('USUARIOS_GESTIONAR')")
public class UsuarioAdminController {

    private final UsuarioAdminService service;

    public UsuarioAdminController(UsuarioAdminService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<UsuarioAdminDto> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return service.listar(q, rol, activo, page, size);
    }

    @GetMapping("/{id}")
    public UsuarioAdminDto obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioAdminDto crear(@Valid @RequestBody UsuarioCrearRequest request) {
        return service.crear(request);
    }

    @PutMapping("/{id}")
    public UsuarioAdminDto actualizar(@PathVariable Long id,
                                      @Valid @RequestBody UsuarioActualizarRequest request) {
        return service.actualizar(id, request);
    }

    @PatchMapping("/{id}/estado")
    public UsuarioAdminDto cambiarEstado(@PathVariable Long id,
                                         @Valid @RequestBody EstadoRequest request,
                                         Authentication auth) {
        return service.cambiarEstado(id, request.activo(), auth.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id, Authentication auth) {
        service.eliminar(id, auth.getName());
    }
}