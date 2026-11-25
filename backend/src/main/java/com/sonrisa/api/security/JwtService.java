package com.sonrisa.api.security;

import com.sonrisa.api.config.AppProperties;
import com.sonrisa.api.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

/** Genera y valida los JWT. Cada token lleva un identificador (jti) para poder invalidarlo. */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(AppProperties props) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.jwt().secret()));
        this.expirationMinutes = props.jwt().expirationMinutes();
    }

    public record TokenGenerado(String token, Instant expiraEn) {
    }

    public TokenGenerado generar(Usuario usuario) {
        Instant ahora = Instant.now();
        Instant expira = ahora.plus(expirationMinutes, ChronoUnit.MINUTES);
        String token = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(usuario.getEmail())
                .claim("uid", usuario.getId())
                .claim("nombre", usuario.getNombreCompleto())
                .claim("roles", usuario.getRoles().stream().map(r -> r.getNombre().name()).sorted().toList())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(expira))
                .signWith(key)
                .compact();
        return new TokenGenerado(token, expira);
    }

    /** Lanza JwtException si el token es inválido o expiró. */
    public Claims validar(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
