package com.sonrisas.backend.controller;

import com.sonrisas.backend.dto.CambiarPasswordRequest;
import com.sonrisas.backend.dto.PerfilDto;
import com.sonrisas.backend.service.PerfilService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class PerfilController {

    private final PerfilService service;

    public PerfilController(PerfilService service) {
        this.service = service;
    }

    @GetMapping
    public PerfilDto perfil(Authentication auth) {
        return service.obtener(auth.getName());
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarPassword(Authentication auth,
                                @Valid @RequestBody CambiarPasswordRequest request) {
        service.cambiarPassword(auth.getName(), request);
    }
}