package com.sonrisa.api.service;

import com.sonrisa.api.config.AppProperties;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.UnauthorizedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/** Valida los tokens de Google y Facebook directamente con cada proveedor. */
@Service
public class SocialAuthService {

    public record PerfilSocial(String proveedorId, String email, String nombre, String apellidos, String foto) {
    }

    private final AppProperties props;
    private final RestClient http = RestClient.create();

    public SocialAuthService(AppProperties props) {
        this.props = props;
    }

    @SuppressWarnings("unchecked")
    public PerfilSocial verificarGoogle(String idToken) {
        Map<String, Object> info;
        try {
            info = http.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={t}", idToken)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException e) {
            throw new UnauthorizedException("No pudimos validar tu cuenta de Google");
        }
        if (info == null || !props.oauth().google().clientId().equals(String.valueOf(info.get("aud")))) {
            throw new UnauthorizedException("El token de Google no pertenece a esta aplicación");
        }
        if (!"true".equals(String.valueOf(info.get("email_verified")))) {
            throw new UnauthorizedException("Tu correo de Google no está verificado");
        }
        String nombre = (String) info.getOrDefault("given_name", "Paciente");
        String apellidos = (String) info.getOrDefault("family_name", "Google");
        return new PerfilSocial((String) info.get("sub"), (String) info.get("email"), nombre, apellidos,
                (String) info.get("picture"));
    }

    @SuppressWarnings("unchecked")
    public PerfilSocial verificarFacebook(String accessToken) {
        String appId = props.oauth().facebook().appId();
        String appToken = appId + "|" + props.oauth().facebook().appSecret();
        try {
            Map<String, Object> debug = http.get()
                    .uri("https://graph.facebook.com/debug_token?input_token={t}&access_token={a}", accessToken, appToken)
                    .retrieve()
                    .body(Map.class);
            Map<String, Object> data = debug == null ? null : (Map<String, Object>) debug.get("data");
            if (data == null || !Boolean.TRUE.equals(data.get("is_valid")) || !appId.equals(String.valueOf(data.get("app_id")))) {
                throw new UnauthorizedException("El token de Facebook no es válido para esta aplicación");
            }
            Map<String, Object> me = http.get()
                    .uri("https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture.width(200).height(200)&access_token={t}",
                            accessToken)
                    .retrieve()
                    .body(Map.class);
            if (me == null || me.get("email") == null) {
                throw new BusinessRuleException("Tu cuenta de Facebook no comparte un correo. Regístrate con correo y contraseña.");
            }
            String foto = null;
            if (me.get("picture") instanceof Map<?, ?> picture && picture.get("data") instanceof Map<?, ?> pd) {
                foto = (String) pd.get("url");
            }
            return new PerfilSocial((String) me.get("id"), (String) me.get("email"),
                    (String) me.getOrDefault("first_name", "Paciente"), (String) me.getOrDefault("last_name", "Facebook"), foto);
        } catch (RestClientException e) {
            throw new UnauthorizedException("No pudimos validar tu cuenta de Facebook");
        }
    }
}
