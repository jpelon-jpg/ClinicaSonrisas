package com.sonrisa.api.security;

import com.sonrisa.api.repository.TokenRevocadoRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Lee el header "Authorization: Bearer <token>" y autentica la petición. */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String ATTR_CLAIMS = "jwtClaims";

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final TokenRevocadoRepository tokenRevocadoRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsServiceImpl userDetailsService,
                                   TokenRevocadoRepository tokenRevocadoRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.tokenRevocadoRepository = tokenRevocadoRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.validar(token);
                boolean revocado = claims.getId() != null && tokenRevocadoRepository.existsById(claims.getId());
                if (!revocado) {
                    AuthUser user = (AuthUser) userDetailsService.loadUserByUsername(claims.getSubject());
                    if (user.isEnabled()) {
                        var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        request.setAttribute(ATTR_CLAIMS, claims);
                    }
                }
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
                // Token inválido o expirado: la petición sigue sin autenticación y responde 401.
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
