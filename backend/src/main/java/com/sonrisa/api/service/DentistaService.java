package com.sonrisa.api.service;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.*;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.ResourceNotFoundException;
import com.sonrisa.api.repository.CitaRepository;
import com.sonrisa.api.repository.DentistaRepository;
import com.sonrisa.api.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DentistaService {

    /** Intervalo de la agenda en minutos. */
    public static final int BLOQUE_MIN = 30;

    private final DentistaRepository dentistaRepository;
    private final CitaRepository citaRepository;

    @Transactional(readOnly = true)
    public List<DentistaResponse> listar() {
        return dentistaRepository.findAllByOrderByIdAsc().stream().map(DtoMapper::dentista).toList();
    }

    @Transactional(readOnly = true)
    public DentistaResponse obtener(Long id) {
        return DtoMapper.dentista(buscar(id));
    }

    @Transactional
    public DentistaResponse actualizar(Long id, DatosDentistaRequest req) {
        Dentista d = buscar(id);
        if (dentistaRepository.existsByCedulaProfesionalAndIdNot(req.cedulaProfesional(), id)) {
            throw new BusinessRuleException("La cédula profesional ya está registrada");
        }
        UsuarioService.aplicar(d, req);
        return DtoMapper.dentista(d);
    }

    /** Horarios libres y ocupados de un dentista en bloques de 30 minutos. */
    @Transactional(readOnly = true)
    public DisponibilidadResponse disponibilidad(Long id, LocalDate fecha) {
        Dentista d = buscar(id);
        List<Cita> citas = citaRepository.findByDentistaIdAndEstadoInAndFechaHoraBetween(id, CitaService.ESTADOS_ACTIVOS,
                fecha.atStartOfDay(), fecha.atTime(LocalTime.MAX));
        List<String> libres = new ArrayList<>();
        List<String> ocupados = new ArrayList<>();
        LocalDateTime ahora = LocalDateTime.now();
        for (LocalTime h = d.getHoraInicio(); h.plusMinutes(BLOQUE_MIN).compareTo(d.getHoraFin()) <= 0; h = h.plusMinutes(BLOQUE_MIN)) {
            LocalDateTime inicio = fecha.atTime(h);
            LocalDateTime fin = inicio.plusMinutes(BLOQUE_MIN);
            boolean ocupado = citas.stream().anyMatch(c -> c.getFechaHora().isBefore(fin) && c.getFin().isAfter(inicio));
            if (ocupado) {
                ocupados.add(h.toString());
            } else if (inicio.isAfter(ahora)) {
                libres.add(h.toString());
            }
            if (h.plusMinutes(BLOQUE_MIN).isBefore(h)) break; // evita desbordar medianoche
        }
        return new DisponibilidadResponse(id, fecha, libres, ocupados);
    }

    Dentista buscar(Long id) {
        return dentistaRepository.findWithUsuarioById(id).orElseThrow(() -> new ResourceNotFoundException("Dentista", id));
    }
}
