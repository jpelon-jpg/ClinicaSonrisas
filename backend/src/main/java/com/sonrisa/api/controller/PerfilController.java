package com.sonrisa.api.controller;

import com.sonrisa.api.dto.PerfilUpdateRequest;
import com.sonrisa.api.dto.UsuarioResponse;
import com.sonrisa.api.service.AuthService;
import com.sonrisa.api.service.PerfilService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfil")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class PerfilController {

    private final AuthService authService;
    private final PerfilService perfilService;

    @GetMapping
    public UsuarioResponse obtener() {
        return authService.me();
    }

    @PutMapping
    public UsuarioResponse actualizar(@Valid @RequestBody PerfilUpdateRequest req) {
        return perfilService.actualizar(req);
    }
}
