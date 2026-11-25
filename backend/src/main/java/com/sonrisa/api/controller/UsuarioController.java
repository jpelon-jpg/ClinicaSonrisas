package com.sonrisa.api.controller;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.NombreRol;
import com.sonrisa.api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    @GetMapping("/usuarios")
    public PageResponse<UsuarioResponse> listar(@RequestParam(required = false) String q,
                                                @RequestParam(required = false) NombreRol rol,
                                                @RequestParam(required = false) Boolean activo,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @RequestParam(required = false) String sort) {
        return service.listar(q, rol, activo, page, size, sort);
    }

    @GetMapping("/usuarios/{id}")
    public UsuarioResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping("/usuarios")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(@Valid @RequestBody UsuarioCreateRequest req) {
        return service.crear(req);
    }

    @PutMapping("/usuarios/{id}")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequest req) {
        return service.actualizar(id, req);
    }

    @PatchMapping("/usuarios/{id}/estado")
    public UsuarioResponse estado(@PathVariable Long id, @Valid @RequestBody EstadoUsuarioRequest req) {
        return service.cambiarEstado(id, req.activo());
    }

    @DeleteMapping("/usuarios/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }

    @GetMapping("/roles")
    public List<RolResponse> roles() {
        return service.roles();
    }
}
