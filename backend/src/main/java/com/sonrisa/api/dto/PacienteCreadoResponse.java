package com.sonrisa.api.dto;

/** La contraseña temporal solo se devuelve una vez, al crear el acceso. */
public record PacienteCreadoResponse(PacienteResponse paciente, String passwordTemporal) {
}
