package com.sonrisa.api.service;

import com.sonrisa.api.dto.PerfilUpdateRequest;
import com.sonrisa.api.dto.UsuarioResponse;
import com.sonrisa.api.entity.Usuario;
import com.sonrisa.api.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final AuthService authService;

    @Transactional
    public UsuarioResponse actualizar(PerfilUpdateRequest req) {
        Usuario u = authService.usuarioActual();
        u.setNombre(req.nombre().trim());
        u.setApellidos(req.apellidos().trim());
        u.setTelefono(req.telefono());
        u.setAvatarUrl(req.avatarUrl());
        return DtoMapper.usuario(u);
    }
}
