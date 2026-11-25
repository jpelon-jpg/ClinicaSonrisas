package com.sonrisa.api.exception;

/** 422: los datos son válidos pero violan una regla del negocio (horario ocupado, correo repetido...). */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String mensaje) {
        super(mensaje);
    }
}
