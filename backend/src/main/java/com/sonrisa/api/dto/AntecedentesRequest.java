package com.sonrisa.api.dto;

import jakarta.validation.constraints.Size;

public record AntecedentesRequest(
        @Size(max = 255, message = "Máximo 255 caracteres")
        String alergias,

        @Size(max = 2000, message = "Máximo 2000 caracteres")
        String antecedentes) {
}
