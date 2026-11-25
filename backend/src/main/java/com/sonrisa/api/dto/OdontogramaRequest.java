package com.sonrisa.api.dto;

import com.sonrisa.api.entity.EstadoPieza;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OdontogramaRequest(
        @NotNull(message = "Selecciona una pieza")
        @Min(value = 11, message = "Pieza inválida (numeración FDI 11-48)")
        @Max(value = 48, message = "Pieza inválida (numeración FDI 11-48)")
        Integer pieza,

        @NotNull(message = "Selecciona el estado de la pieza")
        EstadoPieza estado,

        @Size(max = 255, message = "Máximo 255 caracteres")
        String observacion) {
}
