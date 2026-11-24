package com.sonrisas.backend.security;

import com.sonrisas.backend.repository.TokenRevocadoRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioDetailsService detailsService;
    private final TokenRevocadoRepository revocadoRepository;

    public JwtAuthFilter(JwtService jwtService,
                         UsuarioDetailsService detailsService,
                         TokenRevocadoRepository revocadoRepository) {
        this.jwtService = jwtService;
        this.detailsService = detailsService;
        this.revocadoRepository = revocadoRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.esValido(token)
                    && !revocadoRepository.existsByTokenHash(jwtService.hash(token))
                    && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails ud = detailsService.loadUserByUsername(jwtService.extraerCorreo(token));
                if (ud.isEnabled()) {
                    var auth = new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        chain.doFilter(request, response);
    }
}