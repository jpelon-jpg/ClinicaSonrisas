package com.sonrisa.api.util;

import java.security.SecureRandom;

public final class Passwords {

    private static final SecureRandom RANDOM = new SecureRandom();

    private Passwords() {
    }

    /** Contraseña temporal que cumple la política: mayúscula, número, carácter especial y 8+ caracteres. */
    public static String temporal() {
        return "Sonrisa#" + (1000 + RANDOM.nextInt(9000));
    }
}
