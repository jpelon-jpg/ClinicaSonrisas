package com.sonrisa.api.service;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.*;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.ResourceNotFoundException;
import com.sonrisa.api.repository.*;
import com.sonrisa.api.security.CurrentUser;
import com.sonrisa.api.util.DtoMapper;
import com.sonrisa.api.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Gestión de usuarios del sistema (solo ADMIN). */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final Set<String> ORDEN = Set.of("id", "nombre", "apellidos", "email", "creadoEn");

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PacienteRepository pacienteRepository;
    private final DentistaRepository dentistaRepository;
    private final CitaRepository citaRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UsuarioResponse> listar(String q, NombreRol rol, Boolean activo, int page, int size, String sort) {
        return PageResponse.of(
                usuarioRepository.findAll(Specs.usuarios(q, rol, activo), Paginacion.de(page, size, sort, ORDEN, "-creadoEn")),
                DtoMapper::usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return DtoMapper.usuario(buscar(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioCreateRequest req) {
        if (usuarioRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BusinessRuleException("Ya existe un usuario con ese correo");
        }
        Usuario u = new Usuario();
        u.setNombre(req.nombre().trim());
        u.setApellidos(req.apellidos().trim());
        u.setEmail(req.email().trim().toLowerCase());
        u.setTelefono(req.telefono());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setRoles(roles(req.roles()));
        usuarioRepository.save(u);
        sincronizarPerfiles(u, req.datosDentista());
        return DtoMapper.usuario(u);
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioUpdateRequest req) {
        Usuario u = buscar(id);
        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(req.email(), id)) {
            throw new BusinessRuleException("Ya existe otro usuario con ese correo");
        }
        boolean esYoMismo = CurrentUser.get().id().equals(id);
        if (esYoMismo && (!req.roles().contains(NombreRol.ADMIN) || Boolean.FALSE.equals(req.activo()))) {
            throw new BusinessRuleException("No puedes quitarte el rol de administrador ni desactivar tu propia cuenta");
        }
        u.setNombre(req.nombre().trim());
        u.setApellidos(req.apellidos().trim());
        u.setEmail(req.email().trim().toLowerCase());
        u.setTelefono(req.telefono());
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.activo() != null) {
            u.setActivo(req.activo());
        }
        u.setRoles(roles(req.roles()));
        sincronizarPerfiles(u, req.datosDentista());
        return DtoMapper.usuario(u);
    }

    @Transactional
    public UsuarioResponse cambiarEstado(Long id, boolean activo) {
        if (CurrentUser.get().id().equals(id) && !activo) {
            throw new BusinessRuleException("No puedes desactivar tu propia cuenta");
        }
        Usuario u = buscar(id);
        u.setActivo(activo);
        return DtoMapper.usuario(u);
    }

    /** Solo se eliminan usuarios sin historial clínico; los demás se desactivan (NOM-004 exige conservar el expediente). */
    @Transactional
    public void eliminar(Long id) {
        if (CurrentUser.get().id().equals(id)) {
            throw new BusinessRuleException("No puedes eliminar tu propia cuenta");
        }
        Usuario u = buscar(id);
        pacienteRepository.findByUsuarioId(id).ifPresent(p -> {
            if (citaRepository.existsByPacienteId(p.getId())) {
                throw new BusinessRuleException("El paciente tiene citas registradas. Desactívalo en lugar de eliminarlo.");
            }
            pacienteRepository.delete(p);
        });
        dentistaRepository.findByUsuarioId(id).ifPresent(d -> {
            throw new BusinessRuleException("El dentista tiene historial en el sistema. Desactívalo en lugar de eliminarlo.");
        });
        usuarioRepository.delete(u);
    }

    @Transactional(readOnly = true)
    public List<RolResponse> roles() {
        return rolRepository.findAll().stream()
                .map(r -> new RolResponse(r.getId(), r.getNombre().name(), r.getDescripcion(), rolRepository.contarUsuarios(r.getId())))
                .toList();
    }

    // ------------------------------------------------------------ helpers
    private Usuario buscar(Long id) {
        return usuarioRepository.findWithRolesById(id).orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
    }

    private Set<Rol> roles(Set<NombreRol> nombres) {
        Set<Rol> roles = new HashSet<>();
        for (NombreRol n : nombres) {
            roles.add(rolRepository.findByNombre(n).orElseThrow(() -> new ResourceNotFoundException("Rol", n)));
        }
        return roles;
    }

    /** Crea la ficha de paciente o dentista cuando el usuario recibe ese rol. */
    private void sincronizarPerfiles(Usuario u, DatosDentistaRequest datos) {
        if (u.tieneRol(NombreRol.PACIENTE) && pacienteRepository.findByUsuarioId(u.getId()).isEmpty()) {
            Paciente p = new Paciente();
            p.setUsuario(u);
            pacienteRepository.save(p);
        }
        if (u.tieneRol(NombreRol.DENTISTA)) {
            Dentista d = dentistaRepository.findByUsuarioId(u.getId()).orElse(null);
            if (d == null && datos == null) {
                throw new BusinessRuleException("Para el rol DENTISTA captura especialidad, cédula y consultorio");
            }
            if (datos != null) {
                if (d == null) {
                    d = new Dentista();
                    d.setUsuario(u);
                }
                boolean cedulaRepetida = d.getId() == null
                        ? dentistaRepository.existsByCedulaProfesional(datos.cedulaProfesional())
                        : dentistaRepository.existsByCedulaProfesionalAndIdNot(datos.cedulaProfesional(), d.getId());
                if (cedulaRepetida) {
                    throw new BusinessRuleException("La cédula profesional ya está registrada");
                }
                aplicar(d, datos);
                dentistaRepository.save(d);
            }
        }
    }

    static void aplicar(Dentista d, DatosDentistaRequest datos) {
        if (datos.horaInicio() != null && datos.horaFin() != null && !datos.horaInicio().isBefore(datos.horaFin())) {
            throw new BusinessRuleException("La hora de inicio debe ser anterior a la hora de fin");
        }
        d.setEspecialidad(datos.especialidad());
        d.setCedulaProfesional(datos.cedulaProfesional());
        d.setConsultorio(datos.consultorio());
        if (datos.horaInicio() != null) d.setHoraInicio(datos.horaInicio());
        if (datos.horaFin() != null) d.setHoraFin(datos.horaFin());
    }
}
