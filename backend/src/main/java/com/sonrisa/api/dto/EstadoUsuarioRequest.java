package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotNull;

public record EstadoUsuarioRequest(@NotNull(message = "Indica si el usuario está activo") Boolean activo) {
}
