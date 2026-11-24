package com.sonrisas.backend.dto;

import java.time.LocalDateTime;

public record UsuarioAdminDto(
        Long id,
        String nombre,
        String apellidos,
        String correo,
        String telefono,
        String rol,
        String proveedorAuth,
        Boolean activo,
        LocalDateTime ultimoIngreso,
        String avatarUrl
) {}