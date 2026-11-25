package com.sonrisa.api.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record TratamientoRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "Máximo 100 caracteres")
        String nombre,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(max = 255, message = "Máximo 255 caracteres")
        String descripcion,

        @NotNull(message = "La duración es obligatoria")
        @Min(value = 10, message = "La duración mínima es de 10 minutos")
        @Max(value = 240, message = "La duración máxima es de 240 minutos")
        Integer duracionMin,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
        @Digits(integer = 8, fraction = 2, message = "Precio inválido")
        BigDecimal precio,

        @NotNull(message = "Indica si el tratamiento está activo")
        Boolean activo) {
}
