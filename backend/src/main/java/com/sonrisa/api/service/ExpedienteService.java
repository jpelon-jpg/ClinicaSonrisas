package com.sonrisa.api.service;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.*;
import com.sonrisa.api.exception.BusinessRuleException;
import com.sonrisa.api.exception.ForbiddenException;
import com.sonrisa.api.exception.ResourceNotFoundException;
import com.sonrisa.api.repository.*;
import com.sonrisa.api.security.AuthUser;
import com.sonrisa.api.security.CurrentUser;
import com.sonrisa.api.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Expediente clínico (NOM-004-SSA3-2012 / NOM-013-SSA2-2015):
 * las notas de evolución y los registros del odontograma son de solo-agregar; nunca se editan ni se borran.
 */
@Service
@RequiredArgsConstructor
public class ExpedienteService {

    private final PacienteRepository pacienteRepository;
    private final CitaRepository citaRepository;
    private final NotaEvolucionRepository notaRepository;
    private final OdontogramaRegistroRepository odontogramaRepository;
    private final DentistaRepository dentistaRepository;

    @Transactional(readOnly = true)
    public ExpedienteResponse obtener(Long pacienteId) {
        Paciente p = paciente(pacienteId);
        verificarAcceso(p);
        return armar(p);
    }

    /** El paciente consulta su propio expediente (solo lectura). */
    @Transactional(readOnly = true)
    public ExpedienteResponse propio() {
        Paciente p = pacienteRepository.findByUsuarioId(CurrentUser.get().id())
                .orElseThrow(() -> new ForbiddenException("Tu cuenta no tiene ficha de paciente"));
        return armar(pacienteRepository.findWithUsuarioById(p.getId()).orElseThrow());
    }

    @Transactional
    public PacienteResponse actualizarAntecedentes(Long pacienteId, AntecedentesRequest req) {
        Paciente p = paciente(pacienteId);
        verificarDentistaTratante(p);
        p.setAlergias(req.alergias());
        p.setAntecedentes(req.antecedentes());
        return DtoMapper.paciente(p);
    }

    @Transactional
    public NotaEvolucionResponse agregarNota(Long pacienteId, NotaEvolucionRequest req) {
        Paciente p = paciente(pacienteId);
        Dentista d = verificarDentistaTratante(p);
        NotaEvolucion n = new NotaEvolucion();
        n.setPaciente(p);
        n.setDentista(d);
        if (req.citaId() != null) {
            Cita c = citaRepository.findById(req.citaId()).orElseThrow(() -> new ResourceNotFoundException("Cita", req.citaId()));
            if (!c.getPaciente().getId().equals(pacienteId) || !c.getDentista().getId().equals(d.getId())) {
                throw new BusinessRuleException("La cita no corresponde a este paciente o no la atendiste tú");
            }
            n.setCita(c);
        }
        n.setMotivoConsulta(req.motivoConsulta());
        n.setDiagnostico(req.diagnostico());
        n.setTratamientoRealizado(req.tratamientoRealizado());
        n.setPronostico(req.pronostico());
        n.setIndicaciones(req.indicaciones());
        return DtoMapper.nota(notaRepository.save(n));
    }

    @Transactional
    public OdontogramaResponse registrarPieza(Long pacienteId, OdontogramaRequest req) {
        if (!piezaValida(req.pieza())) {
            throw new BusinessRuleException("La pieza " + req.pieza() + " no existe en la numeración FDI");
        }
        Paciente p = paciente(pacienteId);
        Dentista d = verificarDentistaTratante(p);
        OdontogramaRegistro r = new OdontogramaRegistro();
        r.setPaciente(p);
        r.setDentista(d);
        r.setPieza(req.pieza());
        r.setEstado(req.estado());
        r.setObservacion(req.observacion());
        return DtoMapper.odontograma(odontogramaRepository.save(r));
    }

    @Transactional(readOnly = true)
    public List<OdontogramaResponse> historialPieza(Long pacienteId, Integer pieza) {
        Paciente p = paciente(pacienteId);
        verificarAcceso(p);
        return odontogramaRepository.findByPacienteIdAndPiezaOrderByCreadoEnDescIdDesc(pacienteId, pieza)
                .stream().map(DtoMapper::odontograma).toList();
    }

    // ------------------------------------------------------------ helpers
    private ExpedienteResponse armar(Paciente p) {
        // estado actual = último registro de cada pieza
        Map<Integer, OdontogramaResponse> actual = new LinkedHashMap<>();
        odontogramaRepository.findByPacienteIdOrderByCreadoEnDescIdDesc(p.getId())
                .forEach(r -> actual.putIfAbsent(r.getPieza(), DtoMapper.odontograma(r)));
        List<NotaEvolucionResponse> notas = notaRepository.findByPacienteIdOrderByCreadoEnDesc(p.getId())
                .stream().map(DtoMapper::nota).toList();
        List<CitaResponse> citas = citaRepository.findTop10ByPacienteIdOrderByFechaHoraDesc(p.getId())
                .stream().map(DtoMapper::cita).toList();
        return new ExpedienteResponse(DtoMapper.paciente(p), List.copyOf(actual.values()), notas, citas);
    }

    static boolean piezaValida(int pieza) {
        int cuadrante = pieza / 10;
        int numero = pieza % 10;
        return cuadrante >= 1 && cuadrante <= 4 && numero >= 1 && numero <= 8;
    }

    private Paciente paciente(Long id) {
        return pacienteRepository.findWithUsuarioById(id).orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
    }

    /** ADMIN puede consultar; el dentista solo expedientes de pacientes que ha atendido o tiene agendados. */
    private void verificarAcceso(Paciente p) {
        AuthUser u = CurrentUser.get();
        if (u.tieneRol(NombreRol.ADMIN)) {
            return;
        }
        verificarDentistaTratante(p);
    }

    private Dentista verificarDentistaTratante(Paciente p) {
        Dentista d = dentistaRepository.findByUsuarioId(CurrentUser.get().id())
                .orElseThrow(() -> new ForbiddenException("Solo el dentista tratante puede modificar el expediente"));
        if (!citaRepository.existsByDentistaIdAndPacienteId(d.getId(), p.getId())) {
            throw new ForbiddenException("Este paciente no tiene citas contigo");
        }
        return d;
    }
}
