package com.sonrisas.backend.service;

import com.sonrisas.backend.dto.LoginRequest;
import com.sonrisas.backend.dto.LoginResponse;
import com.sonrisas.backend.dto.UsuarioResumenDto;
import com.sonrisas.backend.model.Usuario;
import com.sonrisas.backend.repository.UsuarioRepository;
import com.sonrisas.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                       UsuarioRepository usuarioRepository,
                       JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.correo(), req.password()));

        Usuario u = usuarioRepository.findByCorreo(req.correo()).orElseThrow();
        u.setUltimoIngreso(LocalDateTime.now());

        String token = jwtService.generarToken(u.getCorreo(), u.getRol().getNombre());
        return new LoginResponse(token, new UsuarioResumenDto(
                u.getId(), u.getNombre(), u.getApellidos(),
                u.getCorreo(), u.getRol().getNombre(), u.getAvatarUrl()));
    }
}
