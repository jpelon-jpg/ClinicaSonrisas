package com.sonrisas.backend.dto;

import jakarta.validation.constraints.NotNull;

public record EstadoRequest(@NotNull(message = "Indica si el usuario está activo") Boolean activo) {}