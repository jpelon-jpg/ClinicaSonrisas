package com.sonrisa.api.dto;

import java.math.BigDecimal;

public record TratamientoResponse(Long id, String nombre, String descripcion, Integer duracionMin, BigDecimal precio, boolean activo) {
}
