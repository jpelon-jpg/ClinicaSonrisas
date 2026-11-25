package com.sonrisa.api.service;

import com.sonrisa.api.dto.CitaResponse;
import com.sonrisa.api.dto.DashboardDtos.*;
import com.sonrisa.api.dto.PageResponse;
import com.sonrisa.api.dto.PacienteResponse;
import com.sonrisa.api.entity.Cita;
import com.sonrisa.api.entity.Dentista;
import com.sonrisa.api.entity.EstadoCita;
import com.sonrisa.api.entity.Paciente;
import com.sonrisa.api.repository.CitaRepository;
import com.sonrisa.api.repository.PacienteRepository;
import com.sonrisa.api.util.DtoMapper;
import com.sonrisa.api.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final CitaService citaService;

    @Transactional(readOnly = true)
    public AdminDashboard admin() {
        LocalDate hoy = LocalDate.now();
        LocalDateTime mes0 = hoy.withDayOfMonth(1).atStartOfDay();
        LocalDateTime mes1 = mes0.plusMonths(1);
        long citasMes = citaRepository.countByFechaHoraBetween(mes0, mes1);
        long canceladas = citaRepository.countByFechaHoraBetweenAndEstadoIn(mes0, mes1,
                EnumSet.of(EstadoCita.CANCELADA, EstadoCita.NO_ASISTIO));
        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (EstadoCita e : EstadoCita.values()) porEstado.put(e.name(), 0L);
        for (Object[] fila : citaRepository.contarPorEstado(mes0, mes1)) {
            porEstado.put(((EstadoCita) fila[0]).name(), (Long) fila[1]);
        }
        List<ConteoDentista> porDentista = citaRepository.contarPorDentista(mes0, mes1, EstadoCita.CANCELADA).stream()
                .map(f -> new ConteoDentista((String) f[0], (Long) f[1])).toList();
        double tasa = citasMes == 0 ? 0 : Math.round(canceladas * 1000.0 / citasMes) / 10.0;
        return new AdminDashboard(citasMes,
                citaRepository.countByFechaHoraBetween(hoy.atStartOfDay(), hoy.atTime(LocalTime.MAX)),
                pacienteRepository.count(),
                pacienteRepository.countByUsuarioCreadoEnAfter(mes0),
                tasa,
                citaRepository.countByEstadoAndFechaHoraGreaterThanEqual(EstadoCita.PENDIENTE, LocalDateTime.now()),
                porEstado, porDentista);
    }

    @Transactional(readOnly = true)
    public RecepcionDashboard recepcion() {
        LocalDate hoy = LocalDate.now();
        LocalDateTime d0 = hoy.atStartOfDay(), d1 = hoy.atTime(LocalTime.MAX);
        List<CitaResponse> proximas = citaRepository.findTop5ByFechaHoraGreaterThanEqualAndEstadoInOrderByFechaHoraAsc(
                LocalDateTime.now(), EnumSet.of(EstadoCita.CONFIRMADA)).stream().map(DtoMapper::cita).toList();
        return new RecepcionDashboard(
                citaRepository.countByFechaHoraBetweenAndEstadoIn(d0, d1, CitaService.ESTADOS_ACTIVOS)
                        + citaRepository.countByFechaHoraBetweenAndEstado(d0, d1, EstadoCita.ATENDIDA),
                citaRepository.countByEstadoAndFechaHoraGreaterThanEqual(EstadoCita.PENDIENTE, LocalDateTime.now()),
                citaRepository.countByFechaHoraBetweenAndEstado(d0, d1, EstadoCita.ATENDIDA),
                proximas);
    }

    /** Agenda del día del dentista autenticado. */
    @Transactional(readOnly = true)
    public DentistaAgenda dentista(LocalDate fecha) {
        Dentista d = citaService.dentistaActual();
        LocalDate dia = fecha == null ? LocalDate.now() : fecha;
        List<Cita> citas = citaRepository.findByDentistaIdAndFechaHoraBetweenOrderByFechaHoraAsc(d.getId(),
                dia.atStartOfDay(), dia.atTime(LocalTime.MAX));
        List<CitaResponse> lista = citas.stream()
                .filter(c -> c.getEstado() != EstadoCita.CANCELADA && c.getEstado() != EstadoCita.RECHAZADA)
                .map(DtoMapper::cita).toList();
        long atendidas = citas.stream().filter(c -> c.getEstado() == EstadoCita.ATENDIDA).count();
        LocalDateTime ahora = LocalDateTime.now();
        CitaResponse siguiente = lista.stream()
                .filter(c -> c.estado().equals("CONFIRMADA") && c.fin().isAfter(ahora))
                .findFirst().orElse(null);
        return new DentistaAgenda(dia.toString(), lista.size(), atendidas, siguiente, lista);
    }

    /** Pacientes que el dentista ha atendido o tiene agendados (paginado en servidor). */
    @Transactional(readOnly = true)
    public PageResponse<PacienteResponse> pacientesDentista(String q, int page, int size) {
        Dentista d = citaService.dentistaActual();
        String filtro = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase() + "%";
        return PageResponse.of(pacienteRepository.buscarPorDentista(d.getId(), filtro,
                Paginacion.de(page, size, null, Set.of("id"), "id")), DtoMapper::paciente);
    }

    @Transactional(readOnly = true)
    public PacienteResumen paciente() {
        Paciente p = citaService.pacienteActual();
        LocalDateTime ahora = LocalDateTime.now();
        CitaResponse proxima = citaRepository.findFirstByPacienteIdAndFechaHoraGreaterThanEqualAndEstadoInOrderByFechaHoraAsc(
                p.getId(), ahora, CitaService.ESTADOS_ACTIVOS).map(DtoMapper::cita).orElse(null);
        return new PacienteResumen(proxima,
                citaRepository.countByPacienteIdAndFechaHoraGreaterThanEqualAndEstadoIn(p.getId(), ahora, CitaService.ESTADOS_ACTIVOS),
                citaRepository.countByPacienteIdAndFechaHoraLessThan(p.getId(), ahora));
    }
}
