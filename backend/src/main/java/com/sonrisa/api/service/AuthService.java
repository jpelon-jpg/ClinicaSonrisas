package com.sonrisa.api.service;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.*;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.ForbiddenException;
import com.sonrisa.api.exception.ResourceNotFoundException;
import com.sonrisa.api.exception.UnauthorizedException;
import com.sonrisa.api.notification.NotificacionService;
import com.sonrisa.api.repository.*;
import com.sonrisa.api.security.AuthUser;
import com.sonrisa.api.security.CurrentUser;
import com.sonrisa.api.security.JwtService;
import com.sonrisa.api.util.DtoMapper;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PacienteRepository pacienteRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final TokenRevocadoRepository tokenRevocadoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SocialAuthService socialAuthService;
    private final NotificacionService notificacionService;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.email().trim(), req.password()));
        Usuario usuario = usuarioRepository.findWithRolesByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new UnauthorizedException("Correo o contraseña incorrectos"));
        return respuesta(usuario);
    }

    /** Auto-registro de pacientes. */
    @Transactional
    public AuthResponse registrar(RegisterRequest req) {
        if (usuarioRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BusinessRuleException("Ya existe una cuenta con ese correo");
        }
        Usuario u = nuevoPaciente(req.nombre(), req.apellidos(), req.email(), req.telefono());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        usuarioRepository.save(u);
        crearFichaPaciente(u);
        notificacionService.bienvenida(u);
        return respuesta(u);
    }

    @Transactional
    public AuthResponse loginGoogle(SocialLoginRequest req) {
        return loginSocial(ProveedorAuth.GOOGLE, socialAuthService.verificarGoogle(req.token()));
    }

    @Transactional
    public AuthResponse loginFacebook(SocialLoginRequest req) {
        return loginSocial(ProveedorAuth.FACEBOOK, socialAuthService.verificarFacebook(req.token()));
    }

    /** Si el correo ya existe se reutiliza la cuenta; si no, se crea un paciente nuevo. */
    private AuthResponse loginSocial(ProveedorAuth proveedor, SocialAuthService.PerfilSocial perfil) {
        Usuario usuario = usuarioRepository.findWithRolesByEmailIgnoreCase(perfil.email()).orElse(null);
        if (usuario == null) {
            usuario = nuevoPaciente(perfil.nombre(), perfil.apellidos(), perfil.email(), null);
            usuario.setProveedor(proveedor);
            usuario.setProveedorId(perfil.proveedorId());
            usuario.setAvatarUrl(perfil.foto());
            usuarioRepository.save(usuario);
            crearFichaPaciente(usuario);
        } else {
            if (!usuario.tieneRol(NombreRol.PACIENTE)) {
                throw new ForbiddenException("El personal de la clínica debe ingresar con correo y contraseña");
            }
            if (!usuario.isActivo()) {
                throw new ForbiddenException("Tu cuenta está desactivada. Comunícate con la clínica.");
            }
            if (usuario.getAvatarUrl() == null) {
                usuario.setAvatarUrl(perfil.foto());
            }
        }
        return respuesta(usuario);
    }

    /** Invalida el token actual guardando su identificador (jti) hasta que expire. */
    @Transactional
    public void logout(Claims claims) {
        if (claims == null || claims.getId() == null) {
            throw new UnauthorizedException("Token inválido");
        }
        LocalDateTime expira = LocalDateTime.ofInstant(claims.getExpiration().toInstant(), ZoneId.systemDefault());
        tokenRevocadoRepository.save(new TokenRevocado(claims.getId(), expira));
    }

    @Transactional(readOnly = true)
    public UsuarioResponse me() {
        return DtoMapper.usuario(usuarioActual());
    }

    @Transactional
    public MensajeResponse cambiarPassword(ChangePasswordRequest req) {
        Usuario u = usuarioActual();
        if (u.getPasswordHash() == null) {
            throw new BusinessRuleException("Tu cuenta usa Google o Facebook; usa la opción de recuperar contraseña para crear una");
        }
        if (!passwordEncoder.matches(req.passwordActual(), u.getPasswordHash())) {
            throw new BusinessRuleException("La contraseña actual no es correcta");
        }
        if (passwordEncoder.matches(req.passwordNueva(), u.getPasswordHash())) {
            throw new BusinessRuleException("La nueva contraseña debe ser distinta a la actual");
        }
        u.setPasswordHash(passwordEncoder.encode(req.passwordNueva()));
        u.setDebeCambiarPassword(false);
        return new MensajeResponse("Contraseña actualizada");
    }

    /** Siempre responde lo mismo para no revelar qué correos existen. */
    @Transactional
    public MensajeResponse olvidePassword(ForgotPasswordRequest req) {
        usuarioRepository.findWithRolesByEmailIgnoreCase(req.email().trim())
                .filter(Usuario::isActivo)
                .ifPresent(u -> {
                    PasswordResetToken t = new PasswordResetToken();
                    t.setUsuario(u);
                    t.setToken(UUID.randomUUID().toString());
                    t.setExpiraEn(LocalDateTime.now().plusMinutes(30));
                    resetTokenRepository.save(t);
                    notificacionService.recuperarPassword(u, t.getToken());
                });
        return new MensajeResponse("Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña");
    }

    @Transactional
    public MensajeResponse restablecerPassword(ResetPasswordRequest req) {
        PasswordResetToken t = resetTokenRepository.findByToken(req.token())
                .orElseThrow(() -> new BusinessRuleException("El enlace no es válido"));
        if (t.isUsado() || t.getExpiraEn().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("El enlace ya se usó o expiró. Solicita uno nuevo.");
        }
        Usuario u = t.getUsuario();
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setDebeCambiarPassword(false);
        t.setUsado(true);
        return new MensajeResponse("Tu contraseña se actualizó. Ya puedes iniciar sesión.");
    }

    // ------------------------------------------------------------ helpers
    Usuario usuarioActual() {
        AuthUser actual = CurrentUser.get();
        return usuarioRepository.findWithRolesById(actual.id())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", actual.id()));
    }

    private Usuario nuevoPaciente(String nombre, String apellidos, String email, String telefono) {
        Usuario u = new Usuario();
        u.setNombre(nombre.trim());
        u.setApellidos(apellidos.trim());
        u.setEmail(email.trim().toLowerCase());
        u.setTelefono(telefono);
        u.getRoles().add(rolRepository.findByNombre(NombreRol.PACIENTE)
                .orElseThrow(() -> new IllegalStateException("No existe el rol PACIENTE")));
        return u;
    }

    private void crearFichaPaciente(Usuario u) {
        Paciente p = new Paciente();
        p.setUsuario(u);
        pacienteRepository.save(p);
    }

    private AuthResponse respuesta(Usuario usuario) {
        JwtService.TokenGenerado token = jwtService.generar(usuario);
        return new AuthResponse(token.token(), "Bearer", token.expiraEn(), DtoMapper.usuario(usuario));
    }
}
