package com.sonrisa.api.service;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.*;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.ResourceNotFoundException;
import com.sonrisa.api.notification.NotificacionService;
import com.sonrisa.api.repository.*;
import com.sonrisa.api.util.DtoMapper;
import com.sonrisa.api.util.Paginacion;
import com.sonrisa.api.util.Passwords;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/** Registro de pacientes por recepción. Si se crea acceso, se genera una contraseña temporal y se envía por correo. */
@Service
@RequiredArgsConstructor
public class PacienteService {

    private static final Set<String> ORDEN = Set.of("id", "usuario.nombre", "usuario.apellidos", "usuario.email", "usuario.creadoEn");

    private final PacienteRepository pacienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final CitaRepository citaRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificacionService notificacionService;

    @Transactional(readOnly = true)
    public PageResponse<PacienteResponse> listar(String q, String acceso, int page, int size, String sort) {
        return PageResponse.of(
                pacienteRepository.findAll(Specs.pacientes(q, acceso), Paginacion.de(page, size, sort, ORDEN, "-usuario.creadoEn")),
                DtoMapper::paciente);
    }

    @Transactional(readOnly = true)
    public PacienteResponse obtener(Long id) {
        return DtoMapper.paciente(buscar(id));
    }

    @Transactional
    public PacienteCreadoResponse crear(PacienteRequest req) {
        if (usuarioRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BusinessRuleException("Ya existe una cuenta con ese correo");
        }
        Usuario u = new Usuario();
        datosUsuario(u, req);
        u.getRoles().add(rolRepository.findByNombre(NombreRol.PACIENTE).orElseThrow());
        String temporal = null;
        if (req.crearAcceso()) {
            temporal = Passwords.temporal();
            u.setPasswordHash(passwordEncoder.encode(temporal));
            u.setDebeCambiarPassword(true);
        }
        usuarioRepository.save(u);
        Paciente p = new Paciente();
        p.setUsuario(u);
        datosClinicos(p, req);
        pacienteRepository.save(p);
        if (temporal != null) {
            notificacionService.credencialesTemporales(u, temporal);
        }
        return new PacienteCreadoResponse(DtoMapper.paciente(p), temporal);
    }

    @Transactional
    public PacienteResponse actualizar(Long id, PacienteRequest req) {
        Paciente p = buscar(id);
        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(req.email(), p.getUsuario().getId())) {
            throw new BusinessRuleException("Ya existe otra cuenta con ese correo");
        }
        datosUsuario(p.getUsuario(), req);
        datosClinicos(p, req);
        return DtoMapper.paciente(p);
    }

    /** Genera (o regenera) la contraseña temporal del paciente y se la envía por correo. */
    @Transactional
    public PacienteCreadoResponse generarAcceso(Long id) {
        Paciente p = buscar(id);
        Usuario u = p.getUsuario();
        if (u.getProveedor() != ProveedorAuth.LOCAL) {
            throw new BusinessRuleException("El paciente ingresa con " + u.getProveedor().name().toLowerCase()
                    + "; no necesita contraseña");
        }
        String temporal = Passwords.temporal();
        u.setPasswordHash(passwordEncoder.encode(temporal));
        u.setDebeCambiarPassword(true);
        notificacionService.credencialesTemporales(u, temporal);
        return new PacienteCreadoResponse(DtoMapper.paciente(p), temporal);
    }

    @Transactional
    public void eliminar(Long id) {
        Paciente p = buscar(id);
        if (citaRepository.existsByPacienteId(id)) {
            throw new BusinessRuleException("El paciente tiene citas e historial clínico; desactiva su cuenta en lugar de eliminarlo");
        }
        Usuario u = p.getUsuario();
        pacienteRepository.delete(p);
        usuarioRepository.delete(u);
    }

    Paciente buscar(Long id) {
        return pacienteRepository.findWithUsuarioById(id).orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
    }

    private void datosUsuario(Usuario u, PacienteRequest req) {
        u.setNombre(req.nombre().trim());
        u.setApellidos(req.apellidos().trim());
        u.setEmail(req.email().trim().toLowerCase());
        u.setTelefono(req.telefono());
    }

    private void datosClinicos(Paciente p, PacienteRequest req) {
        p.setFechaNacimiento(req.fechaNacimiento());
        p.setAlergias(req.alergias());
        p.setAntecedentes(req.antecedentes());
        p.setContactoEmergencia(req.contactoEmergencia());
    }
}
