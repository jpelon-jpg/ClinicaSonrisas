package com.sonrisa.api.notification;

/** Normaliza teléfonos mexicanos al formato internacional E.164 que pide Twilio. */
public final class Telefonos {

    private Telefonos() {
    }

    public static String e164(String telefono) {
        if (telefono == null) {
            return null;
        }
        String digitos = telefono.replaceAll("[^0-9]", "");
        if (telefono.trim().startsWith("+") && digitos.length() >= 10) {
            return "+" + digitos;
        }
        if (digitos.length() == 10) {
            return "+52" + digitos;
        }
        if (digitos.length() == 12 && digitos.startsWith("52")) {
            return "+" + digitos;
        }
        return null;
    }

    public static String whatsapp(String telefono) {
        String e164 = e164(telefono);
        return e164 == null ? null : "whatsapp:" + e164;
    }
}
