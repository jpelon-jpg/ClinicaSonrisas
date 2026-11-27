package com.sonrisa.api.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

/** WhatsApp Cloud API de Meta (número de prueba o número aprobado). */
@Component
public class WhatsappMetaClient {

    private final String token;
    private final String phoneId;
    private final String version;
    private final String plantilla;
    private final String idioma;
    private final boolean agregarUnoMexico;
    private final RestClient http = RestClient.create();

    public WhatsappMetaClient(
            @Value("${app.whatsapp.meta.token:}") String token,
            @Value("${app.whatsapp.meta.phone-id:}") String phoneId,
            @Value("${app.whatsapp.meta.api-version:v25.0}") String version,
            @Value("${app.whatsapp.meta.template:hello_world}") String plantilla,
            @Value("${app.whatsapp.meta.language:en_US}") String idioma,
            @Value("${app.whatsapp.meta.mexico-agrega-1:false}") boolean agregarUnoMexico) {
        this.token = token;
        this.phoneId = phoneId;
        this.version = version;
        this.plantilla = plantilla;
        this.idioma = idioma;
        this.agregarUnoMexico = agregarUnoMexico;
    }

    public boolean configurado() {
        return !token.isBlank() && !phoneId.isBlank();
    }

    /** Lanza excepción si Meta rechaza el envío; quien llama registra el resultado. */
    public void enviar(String telefonoE164, String texto) {
        String to = telefonoE164.replace("+", "");
        if (agregarUnoMexico && to.startsWith("52") && to.length() == 12) {
            to = "521" + to.substring(2);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", to);
        if (!plantilla.isBlank()) {
            body.put("type", "template");
            body.put("template", Map.of("name", plantilla, "language", Map.of("code", idioma)));
        } else {
            body.put("type", "text");
            body.put("text", Map.of("body", texto));
        }

        http.post()
                .uri("https://graph.facebook.com/{version}/{id}/messages", version, phoneId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}