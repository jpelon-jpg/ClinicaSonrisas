package com.sonrisas.backend.service;

import com.sonrisas.backend.dto.LoginRequest;
import com.sonrisas.backend.dto.LoginResponse;
import com.sonrisas.backend.dto.RegistroRequest;
import com.sonrisas.backend.dto.UsuarioResumenDto;
import com.sonrisas.backend.exception.ReglaNegocioException;
import com.sonrisas.backend.model.Paciente;
import com.sonrisas.backend.model.Rol;
import com.sonrisas.backend.model.TokenRevocado;
import com.sonrisas.backend.model.Usuario;
import com.sonrisas.backend.repository.PacienteRepository;
import com.sonrisas.backend.repository.RolRepository;
import com.sonrisas.backend.repository.TokenRevocadoRepository;
import com.sonrisas.backend.repository.UsuarioRepository;
import com.sonrisas.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    private final RolRepository rolRepository;
    private final PacienteRepository pacienteRepository;
    private final TokenRevocadoRepository revocadoRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                   UsuarioRepository usuarioRepository,
                   JwtService jwtService,
                   RolRepository rolRepository,
                   PacienteRepository pacienteRepository,
                   TokenRevocadoRepository revocadoRepository,
                   PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.rolRepository = rolRepository;
        this.pacienteRepository = pacienteRepository;
        this.revocadoRepository = revocadoRepository;
        this.passwordEncoder = passwordEncoder;
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

    @Transactional
public UsuarioResumenDto registrar(RegistroRequest req) {
    if (usuarioRepository.existsByCorreo(req.correo())) {
        throw new ReglaNegocioException("Ya existe una cuenta con ese correo");
    }
    Rol rol = rolRepository.findByNombre("PACIENTE").orElseThrow();

    Usuario u = new Usuario();
    u.setNombre(req.nombre());
    u.setApellidos(req.apellidos());
    u.setCorreo(req.correo());
    u.setTelefono(req.telefono() == null || req.telefono().isBlank() ? null : req.telefono());
    u.setPasswordHash(passwordEncoder.encode(req.password()));
    u.setRol(rol);
    usuarioRepository.save(u);

    Paciente p = new Paciente();
    p.setUsuario(u);
    pacienteRepository.save(p);

    return new UsuarioResumenDto(u.getId(), u.getNombre(), u.getApellidos(),
            u.getCorreo(), rol.getNombre(), u.getAvatarUrl());
}

    @Transactional
    public void logout(String token) {
        if (!jwtService.esValido(token)) return;
        String h = jwtService.hash(token);
        if (revocadoRepository.existsByTokenHash(h)) return;
        TokenRevocado t = new TokenRevocado();
        t.setTokenHash(h);
        t.setExpiraEn(jwtService.extraerExpiracion(token));
        revocadoRepository.save(t);
    }

}
