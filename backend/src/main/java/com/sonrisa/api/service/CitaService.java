package com.sonrisa.api.service;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.*;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.ForbiddenException;
import com.sonrisa.api.exception.ResourceNotFoundException;
import com.sonrisa.api.notification.NotificacionService;
import com.sonrisa.api.repository.*;
import com.sonrisa.api.security.AuthUser;
import com.sonrisa.api.security.CurrentUser;
import com.sonrisa.api.util.DtoMapper;
import com.sonrisa.api.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Ciclo de vida de una cita:
 * EN_LINEA (paciente) → PENDIENTE → CONFIRMADA / RECHAZADA (recepción)
 * RECEPCION → CONFIRMADA directamente
 * CONFIRMADA → ATENDIDA / NO_ASISTIO (dentista o recepción) · PENDIENTE/CONFIRMADA → CANCELADA
 */
@Service
@RequiredArgsConstructor
public class CitaService {

    public static final Set<EstadoCita> ESTADOS_ACTIVOS = EnumSet.of(EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA);
    private static final Set<String> ORDEN = Set.of("id", "fechaHora", "estado", "creadoEn");

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final DentistaRepository dentistaRepository;
    private final TratamientoRepository tratamientoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    // ------------------------------------------------------------ consultas
    @Transactional(readOnly = true)
    public PageResponse<CitaResponse> listar(String q, EstadoCita estado, Long dentistaId, Long pacienteId, OrigenCita origen,
                                             LocalDate desde, LocalDate hasta, int page, int size, String sort) {
        return PageResponse.of(citaRepository.findAll(Specs.citas(q, estado, dentistaId, pacienteId, origen, desde, hasta),
                Paginacion.de(page, size, sort, ORDEN, "fechaHora")), DtoMapper::cita);
    }

    @Transactional(readOnly = true)
    public CitaResponse obtener(Long id) {
        Cita c = buscar(id);
        verificarAcceso(c);
        return DtoMapper.cita(c);
    }

    /** Citas del paciente autenticado: tipo = proximas | historial. */
    @Transactional(readOnly = true)
    public PageResponse<CitaResponse> misCitasPaciente(String tipo, EstadoCita estado, int page, int size) {
        Paciente p = pacienteActual();
        LocalDate hoy = LocalDate.now();
        boolean historial = "historial".equalsIgnoreCase(tipo);
        return PageResponse.of(citaRepository.findAll(
                Specs.citas(null, estado, null, p.getId(), null, historial ? null : hoy, historial ? hoy.minusDays(1) : null),
                Paginacion.de(page, size, null, ORDEN, historial ? "-fechaHora" : "fechaHora")), DtoMapper::cita);
    }

    @Transactional(readOnly = true)
    public PageResponse<CitaResponse> misCitasDentista(String q, EstadoCita estado, LocalDate desde, LocalDate hasta, int page, int size) {
        Dentista d = dentistaActual();
        return PageResponse.of(citaRepository.findAll(Specs.citas(q, estado, d.getId(), null, null, desde, hasta),
                Paginacion.de(page, size, null, ORDEN, "-fechaHora")), DtoMapper::cita);
    }

    // ------------------------------------------------------------ alta
    /** Recepción/administración: la cita nace CONFIRMADA y se notifica por los tres canales. */
    @Transactional
    public CitaResponse crear(CitaRequest req) {
        Paciente p = pacienteRepository.findWithUsuarioById(req.pacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", req.pacienteId()));
        Cita c = nueva(p, req.dentistaId(), req.fechaHora(), req.tratamientoIds(), req.motivo(), null);
        c.setOrigen(OrigenCita.RECEPCION);
        c.setEstado(EstadoCita.CONFIRMADA);
        citaRepository.save(c);
        notificacionService.citaConfirmada(c);
        return DtoMapper.cita(c);
    }

    /** Paciente en línea: la cita queda PENDIENTE hasta que recepción la confirme. */
    @Transactional
    public CitaResponse solicitar(CitaPacienteRequest req) {
        Paciente p = pacienteActual();
        long pendientes = citaRepository.countByPacienteIdAndFechaHoraGreaterThanEqualAndEstadoIn(p.getId(),
                LocalDateTime.now(), EnumSet.of(EstadoCita.PENDIENTE));
        if (pendientes >= 3) {
            throw new BusinessRuleException("Ya tienes 3 solicitudes pendientes. Espera a que la clínica las confirme.");
        }
        Cita c = nueva(p, req.dentistaId(), req.fechaHora(), req.tratamientoIds(), req.motivo(), null);
        c.setOrigen(OrigenCita.EN_LINEA);
        c.setEstado(EstadoCita.PENDIENTE);
        return DtoMapper.cita(citaRepository.save(c));
    }

    @Transactional
    public CitaResponse actualizar(Long id, CitaRequest req) {
        Cita c = buscar(id);
        exigirEstado(c, ESTADOS_ACTIVOS, "Solo se pueden editar citas pendientes o confirmadas");
        Paciente p = pacienteRepository.findWithUsuarioById(req.pacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", req.pacienteId()));
        boolean cambioHorario = !c.getFechaHora().equals(req.fechaHora()) || !c.getDentista().getId().equals(req.dentistaId());
        nueva(p, req.dentistaId(), req.fechaHora(), req.tratamientoIds(), req.motivo(), c);
        if (cambioHorario && c.getEstado() == EstadoCita.CONFIRMADA) {
            notificacionService.citaConfirmada(c);
        }
        return DtoMapper.cita(c);
    }

    // ------------------------------------------------------------ transiciones
    @Transactional
    public CitaResponse confirmar(Long id) {
        Cita c = buscar(id);
        exigirEstado(c, EnumSet.of(EstadoCita.PENDIENTE), "Solo se confirman solicitudes pendientes");
        validarTraslape(c.getDentista().getId(), c.getPaciente().getId(), c.getFechaHora(), c.getDuracionMin(), c.getId());
        c.setEstado(EstadoCita.CONFIRMADA);
        notificacionService.citaConfirmada(c);
        return DtoMapper.cita(c);
    }

    @Transactional
    public CitaResponse rechazar(Long id, String motivo) {
        Cita c = buscar(id);
        exigirEstado(c, EnumSet.of(EstadoCita.PENDIENTE), "Solo se rechazan solicitudes pendientes");
        c.setEstado(EstadoCita.RECHAZADA);
        c.setMotivoRechazo(motivo);
        notificacionService.solicitudRechazada(c, motivo);
        return DtoMapper.cita(c);
    }

    @Transactional
    public CitaResponse cancelar(Long id, String motivo) {
        Cita c = buscar(id);
        exigirEstado(c, ESTADOS_ACTIVOS, "La cita ya no se puede cancelar");
        c.setEstado(EstadoCita.CANCELADA);
        c.setMotivoRechazo(motivo);
        notificacionService.citaCancelada(c, motivo);
        return DtoMapper.cita(c);
    }

    /** El paciente cancela su propia cita con al menos 24 h de anticipación. */
    @Transactional
    public CitaResponse cancelarPorPaciente(Long id, String motivo) {
        Cita c = buscar(id);
        if (!c.getPaciente().getId().equals(pacienteActual().getId())) {
            throw new ForbiddenException("Esta cita no es tuya");
        }
        exigirEstado(c, ESTADOS_ACTIVOS, "La cita ya no se puede cancelar");
        if (c.getFechaHora().isBefore(LocalDateTime.now().plusHours(24))) {
            throw new BusinessRuleException("Las cancelaciones en línea requieren 24 h de anticipación. Llama a la clínica.");
        }
        c.setEstado(EstadoCita.CANCELADA);
        c.setMotivoRechazo(motivo);
        notificacionService.citaCancelada(c, motivo);
        return DtoMapper.cita(c);
    }

    @Transactional
    public CitaResponse marcarAtendida(Long id) {
        return cerrar(id, EstadoCita.ATENDIDA);
    }

    @Transactional
    public CitaResponse marcarNoAsistio(Long id) {
        return cerrar(id, EstadoCita.NO_ASISTIO);
    }

    @Transactional
    public CitaResponse enviarRecordatorio(Long id) {
        Cita c = buscar(id);
        exigirEstado(c, EnumSet.of(EstadoCita.CONFIRMADA), "Solo se envían recordatorios de citas confirmadas");
        notificacionService.recordatorio(c);
        return DtoMapper.cita(c);
    }

    @Transactional
    public void eliminar(Long id) {
        Cita c = buscar(id);
        if (c.getEstado() == EstadoCita.ATENDIDA) {
            throw new BusinessRuleException("Una cita atendida forma parte del expediente y no se puede eliminar");
        }
        citaRepository.delete(c);
    }

    // ------------------------------------------------------------ helpers
    private CitaResponse cerrar(Long id, EstadoCita nuevo) {
        Cita c = buscar(id);
        verificarAcceso(c);
        exigirEstado(c, EnumSet.of(EstadoCita.CONFIRMADA), "Solo las citas confirmadas se pueden cerrar");
        if (c.getFechaHora().isAfter(LocalDateTime.now().plusMinutes(30))) {
            throw new BusinessRuleException("La cita aún no ocurre");
        }
        c.setEstado(nuevo);
        return DtoMapper.cita(c);
    }

    private Cita nueva(Paciente p, Long dentistaId, LocalDateTime fechaHora, Set<Long> tratamientoIds, String motivo, Cita existente) {
        Dentista d = dentistaRepository.findWithUsuarioById(dentistaId)
                .orElseThrow(() -> new ResourceNotFoundException("Dentista", dentistaId));
        if (!d.getUsuario().isActivo()) {
            throw new BusinessRuleException("El dentista no está disponible");
        }
        List<Tratamiento> tratamientos = tratamientoRepository.findAllById(tratamientoIds);
        if (tratamientos.size() != tratamientoIds.size()) {
            throw new ResourceNotFoundException("Uno o más tratamientos no existen");
        }
        if (tratamientos.stream().anyMatch(t -> !t.isActivo())) {
            throw new BusinessRuleException("Uno de los tratamientos seleccionados ya no se ofrece");
        }
        int duracion = Math.max(DentistaService.BLOQUE_MIN, tratamientos.stream().mapToInt(Tratamiento::getDuracionMin).sum());
        if (fechaHora.toLocalTime().isBefore(d.getHoraInicio())
                || fechaHora.plusMinutes(duracion).toLocalTime().isAfter(d.getHoraFin())
                || !fechaHora.toLocalDate().equals(fechaHora.plusMinutes(duracion).toLocalDate())) {
            throw new BusinessRuleException("El horario queda fuera del turno del dentista (" + d.getHoraInicio() + " – " + d.getHoraFin() + ")");
        }
        if (fechaHora.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            throw new BusinessRuleException("La clínica no abre los domingos");
        }
        validarTraslape(d.getId(), p.getId(), fechaHora, duracion, existente == null ? null : existente.getId());

        Cita c = existente != null ? existente : new Cita();
        c.setPaciente(p);
        c.setDentista(d);
        c.setFechaHora(fechaHora);
        c.setDuracionMin(duracion);
        c.setMotivo(motivo);
        c.getTratamientos().clear();
        c.getTratamientos().addAll(tratamientos);
        if (existente == null) {
            c.setCreadoPor(usuarioRepository.getReferenceById(CurrentUser.get().id()));
        }
        return c;
    }

    private void validarTraslape(Long dentistaId, Long pacienteId, LocalDateTime inicio, int duracion, Long excluirId) {
        LocalDateTime fin = inicio.plusMinutes(duracion);
        LocalDateTime dia0 = inicio.toLocalDate().atStartOfDay();
        LocalDateTime dia1 = dia0.plusDays(1);
        boolean dentistaOcupado = citaRepository.findByDentistaIdAndEstadoInAndFechaHoraBetween(dentistaId, ESTADOS_ACTIVOS, dia0, dia1)
                .stream().anyMatch(c -> !c.getId().equals(excluirId) && c.getFechaHora().isBefore(fin) && c.getFin().isAfter(inicio));
        if (dentistaOcupado) {
            throw new BusinessRuleException("El dentista ya tiene una cita en ese horario");
        }
        boolean pacienteOcupado = citaRepository.findByPacienteIdAndEstadoInAndFechaHoraBetween(pacienteId, ESTADOS_ACTIVOS, dia0, dia1)
                .stream().anyMatch(c -> !c.getId().equals(excluirId) && c.getFechaHora().isBefore(fin) && c.getFin().isAfter(inicio));
        if (pacienteOcupado) {
            throw new BusinessRuleException("El paciente ya tiene otra cita en ese horario");
        }
    }

    private void exigirEstado(Cita c, Set<EstadoCita> permitidos, String mensaje) {
        if (!permitidos.contains(c.getEstado())) {
            throw new BusinessRuleException(mensaje + " (estado actual: " + c.getEstado() + ")");
        }
    }

    /** El paciente solo ve sus citas y el dentista solo las suyas. */
    private void verificarAcceso(Cita c) {
        AuthUser u = CurrentUser.get();
        if (u.tieneRol(NombreRol.ADMIN) || u.tieneRol(NombreRol.RECEPCIONISTA)) {
            return;
        }
        if (u.tieneRol(NombreRol.DENTISTA) && c.getDentista().getUsuario().getId().equals(u.id())) {
            return;
        }
        if (u.tieneRol(NombreRol.PACIENTE) && c.getPaciente().getUsuario().getId().equals(u.id())) {
            return;
        }
        throw new ForbiddenException("No tienes acceso a esta cita");
    }

    private Cita buscar(Long id) {
        return citaRepository.findDetalleById(id).orElseThrow(() -> new ResourceNotFoundException("Cita", id));
    }

    Paciente pacienteActual() {
        return pacienteRepository.findByUsuarioId(CurrentUser.get().id())
                .orElseThrow(() -> new ForbiddenException("Tu cuenta no tiene ficha de paciente"));
    }

    Dentista dentistaActual() {
        return dentistaRepository.findByUsuarioId(CurrentUser.get().id())
                .orElseThrow(() -> new ForbiddenException("Tu cuenta no tiene perfil de dentista"));
    }
}
