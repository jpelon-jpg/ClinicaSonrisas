package com.sonrisas.backend.service;

import com.sonrisas.backend.dto.CambiarPasswordRequest;
import com.sonrisas.backend.dto.PerfilDto;
import com.sonrisas.backend.exception.RecursoNoEncontradoException;
import com.sonrisas.backend.exception.ReglaNegocioException;
import com.sonrisas.backend.model.Permiso;
import com.sonrisas.backend.model.Usuario;
import com.sonrisas.backend.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PerfilService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public PerfilService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PerfilDto obtener(String correo) {
        Usuario u = buscar(correo);
        List<String> permisos = u.getRol().getPermisos().stream()
                .map(Permiso::getCodigo).sorted().toList();
        return new PerfilDto(u.getId(), u.getNombre(), u.getApellidos(), u.getCorreo(),
                u.getTelefono(), u.getRol().getNombre(), u.getAvatarUrl(), permisos);
    }

    @Transactional
    public void cambiarPassword(String correo, CambiarPasswordRequest req) {
        Usuario u = buscar(correo);
        if (!passwordEncoder.matches(req.passwordActual(), u.getPasswordHash())) {
            throw new ReglaNegocioException("La contraseña actual es incorrecta");
        }
        u.setPasswordHash(passwordEncoder.encode(req.passwordNueva()));
    }

    private Usuario buscar(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }
}