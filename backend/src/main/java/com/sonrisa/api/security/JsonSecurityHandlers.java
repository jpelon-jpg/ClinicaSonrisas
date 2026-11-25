package com.sonrisa.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonrisa.api.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/** Respuestas JSON para 401 (sin token o token inválido) y 403 (sin permiso por rol). */
@Component
public class JsonSecurityHandlers {

    private final ObjectMapper objectMapper;

    public JsonSecurityHandlers(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AuthenticationEntryPoint entryPoint() {
        return (request, response, ex) -> write(response, 401, "Unauthorized",
                "Debes iniciar sesión o tu sesión expiró", request.getRequestURI());
    }

    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> write(response, 403, "Forbidden",
                "No tienes permiso para acceder a este recurso", request.getRequestURI());
    }

    private void write(HttpServletResponse response, int status, String error, String msg, String path) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), ErrorResponse.of(status, error, msg, path));
    }
}
