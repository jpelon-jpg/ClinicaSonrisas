package com.sonrisa.api.exception;

/** 403: el usuario está autenticado pero no puede acceder a este recurso. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String mensaje) {
        super(mensaje);
    }
}
