package com.sonrisas.backend.dto;

public record LoginResponse(String token, UsuarioResumenDto usuario) {}