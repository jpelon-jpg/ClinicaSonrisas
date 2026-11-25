package com.sonrisa.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record DatosDentistaRequest(
        @NotBlank(message = "La especialidad es obligatoria")
        @Size(max = 100, message = "Máximo 100 caracteres")
        String especialidad,

        @NotBlank(message = "La cédula profesional es obligatoria")
        @Pattern(regexp = "^[0-9]{7,8}$", message = "La cédula debe tener 7 u 8 dígitos")
        String cedulaProfesional,

        @NotBlank(message = "El consultorio es obligatorio")
        @Size(max = 50, message = "Máximo 50 caracteres")
        String consultorio,

        @NotNull(message = "La hora de inicio es obligatoria")
        LocalTime horaInicio,

        @NotNull(message = "La hora de fin es obligatoria")
        LocalTime horaFin) {
}
