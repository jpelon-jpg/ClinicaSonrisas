package com.sonrisa.api.dto;

/** Expresiones regulares compartidas por las validaciones de los DTOs. */
public final class Validaciones {

    private Validaciones() {
    }

    /** Mínimo 8 caracteres, una mayúscula, un número y un carácter especial. */
    public static final String PASSWORD = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,72}$";
    public static final String PASSWORD_MSG =
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial";

    /** Teléfono en formato internacional, por ejemplo +529511234567. */
    public static final String TELEFONO = "^\\+?[0-9]{10,15}$";
    public static final String TELEFONO_MSG = "El teléfono debe tener de 10 a 15 dígitos (puede iniciar con +)";

    public static final String NOMBRE = "^[\\p{L} .'-]+$";
    public static final String NOMBRE_MSG = "Solo se permiten letras y espacios";
}
