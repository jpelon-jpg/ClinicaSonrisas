package com.sonrisa.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Propiedades propias de la aplicación (prefijo "app" en application.properties). */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Cors cors,
        String frontendUrl,
        Mail mail,
        Oauth oauth,
        Twilio twilio,
        Notificaciones notificaciones) {

    public record Jwt(String secret, long expirationMinutes) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Mail(String from) {
    }

    public record Oauth(Google google, Facebook facebook) {
        public record Google(String clientId) {
        }

        public record Facebook(String appId, String appSecret) {
        }
    }

    public record Twilio(String accountSid, String authToken, String smsFrom, String whatsappFrom) {
    }

    public record Notificaciones(Canal email, Canal sms, Canal whatsapp) {
        public record Canal(boolean enabled) {
        }
    }
}
