package com.sonrisas.backend.dto;

public record UsuarioResumenDto(
        Long id,
        String nombre,
        String apellidos,
        String correo,
        String rol,
        String avatarUrl
) {}