package com.sonrisa.api.dto;

import java.time.LocalDateTime;
import java.util.List;

public record UsuarioResponse(
        Long id,
        String nombre,
        String apellidos,
        String nombreCompleto,
        String email,
        String telefono,
        String avatarUrl,
        String proveedor,
        boolean activo,
        boolean debeCambiarPassword,
        List<String> roles,
        LocalDateTime creadoEn) {
}
