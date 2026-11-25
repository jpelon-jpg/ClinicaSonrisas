package com.sonrisa.api.dto;

import java.time.Instant;

public record AuthResponse(String token, String tipo, Instant expiraEn, UsuarioResponse usuario) {
}
