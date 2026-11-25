package com.sonrisas.backend.dto;

import java.util.List;

public record PerfilDto(
        Long id,
        String nombre,
        String apellidos,
        String correo,
        String telefono,
        String rol,
        String avatarUrl,
        List<String> permisos
) {}