package com.sonrisas.backend.service;

import com.sonrisas.backend.dto.*;
import com.sonrisas.backend.exception.RecursoNoEncontradoException;
import com.sonrisas.backend.exception.ReglaNegocioException;
import com.sonrisas.backend.model.Dentista;
import com.sonrisas.backend.model.Paciente;
import com.sonrisas.backend.model.Rol;
import com.sonrisas.backend.model.Usuario;
import com.sonrisas.backend.repository.DentistaRepository;
import com.sonrisas.backend.repository.PacienteRepository;
import com.sonrisas.backend.repository.RolRepository;
import com.sonrisas.backend.repository.UsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioAdminService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PacienteRepository pacienteRepository;
    private final DentistaRepository dentistaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioAdminService(UsuarioRepository usuarioRepository,
                               RolRepository rolRepository,
                               PacienteRepository pacienteRepository,
                               DentistaRepository dentistaRepository,
                               PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.pacienteRepository = pacienteRepository;
        this.dentistaRepository = dentistaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PageResponse<UsuarioAdminDto> listar(String q, String rol, Boolean activo, int page, int size) {
        String busqueda = q == null ? "" : q.trim();
        String rolFiltro = (rol == null || rol.isBlank()) ? null : rol;
        int tamano = Math.max(1, Math.min(size, 50));
        var pageable = PageRequest.of(Math.max(page, 0), tamano, Sort.by("id").descending());
        return PageResponse.of(usuarioRepository.buscar(busqueda, rolFiltro, activo, pageable)
                .map(this::aDto));
    }

    @Transactional(readOnly = true)
    public UsuarioAdminDto obtener(Long id) {
        return aDto(buscarPorId(id));
    }

    @Transactional
    public UsuarioAdminDto crear(UsuarioCrearRequest req) {
        if (usuarioRepository.existsByCorreo(req.correo())) {
            throw new ReglaNegocioException("Ya existe una cuenta con ese correo");
        }
        Rol rol = rolRepository.findByNombre(req.rol())
                .orElseThrow(() -> new RecursoNoEncontradoException("El rol no existe"));

        Usuario u = new Usuario();
        u.setNombre(req.nombre());
        u.setApellidos(req.apellidos());
        u.setCorreo(req.correo());
        u.setTelefono(limpiarTelefono(req.telefono()));
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setRol(rol);
        usuarioRepository.save(u);

        if ("DENTISTA".equals(rol.getNombre())) {
            Dentista d = new Dentista();
            d.setUsuario(u);
            dentistaRepository.save(d);
        } else if ("PACIENTE".equals(rol.getNombre())) {
            Paciente p = new Paciente();
            p.setUsuario(u);
            pacienteRepository.save(p);
        }
        return aDto(u);
    }

    @Transactional
    public UsuarioAdminDto actualizar(Long id, UsuarioActualizarRequest req) {
        Usuario u = buscarPorId(id);
        u.setNombre(req.nombre());
        u.setApellidos(req.apellidos());
        u.setTelefono(limpiarTelefono(req.telefono()));
        return aDto(u);
    }

    @Transactional
    public UsuarioAdminDto cambiarEstado(Long id, boolean activo, String correoActual) {
        Usuario u = buscarPorId(id);
        if (!activo && u.getCorreo().equals(correoActual)) {
            throw new ReglaNegocioException("No puedes desactivar tu propia cuenta");
        }
        u.setActivo(activo);
        return aDto(u);
    }

    @Transactional
    public void eliminar(Long id, String correoActual) {
        Usuario u = buscarPorId(id);
        if (u.getCorreo().equals(correoActual)) {
            throw new ReglaNegocioException("No puedes eliminar tu propia cuenta");
        }
        pacienteRepository.deleteByUsuarioId(id);
        dentistaRepository.deleteByUsuarioId(id);
        usuarioRepository.delete(u);
        usuarioRepository.flush();
    }

    private Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    private String limpiarTelefono(String t) {
        return (t == null || t.isBlank()) ? null : t;
    }

    private UsuarioAdminDto aDto(Usuario u) {
        return new UsuarioAdminDto(u.getId(), u.getNombre(), u.getApellidos(), u.getCorreo(),
                u.getTelefono(), u.getRol().getNombre(), u.getProveedorAuth(),
                u.getActivo(), u.getUltimoIngreso(), u.getAvatarUrl());
    }
}