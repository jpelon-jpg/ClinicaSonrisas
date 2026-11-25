package com.sonrisa.api.exception;

/** 401: credenciales o token inválidos. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String mensaje) {
        super(mensaje);
    }
}
