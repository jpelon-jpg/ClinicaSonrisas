package com.sonrisa.api.exception;

/** 404: el recurso solicitado no existe. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String recurso, Object id) {
        super(recurso + " con id " + id + " no existe");
    }

    public ResourceNotFoundException(String mensaje) {
        super(mensaje);
    }
}
