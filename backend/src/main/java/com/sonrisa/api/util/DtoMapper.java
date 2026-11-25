package com.sonrisa.api.util;

import com.sonrisa.api.dto.*;
import com.sonrisa.api.entity.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.Comparator;
import java.util.List;

/** Convierte entidades JPA en DTOs de respuesta. Las entidades nunca salen del backend. */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static UsuarioResponse usuario(Usuario u) {
        List<String> roles = u.getRoles().stream().map(r -> r.getNombre().name()).sorted().toList();
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getApellidos(), u.getNombreCompleto(), u.getEmail(),
                u.getTelefono(), u.getAvatarUrl(), u.getProveedor().name(), u.isActivo(), u.isDebeCambiarPassword(),
                roles, u.getCreadoEn());
    }

    public static String acceso(Usuario u) {
        return switch (u.getProveedor()) {
            case GOOGLE -> "GOOGLE";
            case FACEBOOK -> "FACEBOOK";
            case LOCAL -> u.getPasswordHash() != null ? "CORREO" : "SIN_ACCESO";
        };
    }

    public static PacienteResponse paciente(Paciente p) {
        Usuario u = p.getUsuario();
        Integer edad = p.getFechaNacimiento() == null ? null
                : Period.between(p.getFechaNacimiento(), LocalDate.now()).getYears();
        return new PacienteResponse(p.getId(), u.getId(), u.getNombre(), u.getApellidos(), u.getNombreCompleto(),
                u.getEmail(), u.getTelefono(), u.getAvatarUrl(), acceso(u), u.isActivo(), p.getFechaNacimiento(), edad,
                p.getAlergias(), p.getAntecedentes(), p.getContactoEmergencia());
    }

    public static DentistaResponse dentista(Dentista d) {
        Usuario u = d.getUsuario();
        return new DentistaResponse(d.getId(), u.getId(), u.getNombreCompleto(), u.getEmail(), u.getTelefono(),
                u.getAvatarUrl(), d.getEspecialidad(), d.getCedulaProfesional(), d.getConsultorio(), d.getHoraInicio(),
                d.getHoraFin(), u.isActivo());
    }

    public static TratamientoResponse tratamiento(Tratamiento t) {
        return new TratamientoResponse(t.getId(), t.getNombre(), t.getDescripcion(), t.getDuracionMin(), t.getPrecio(), t.isActivo());
    }

    public static CitaResponse cita(Cita c) {
        Usuario up = c.getPaciente().getUsuario();
        Dentista d = c.getDentista();
        List<CitaResponse.TratamientoRef> tratamientos = c.getTratamientos().stream()
                .sorted(Comparator.comparing(Tratamiento::getNombre))
                .map(t -> new CitaResponse.TratamientoRef(t.getId(), t.getNombre(), t.getPrecio()))
                .toList();
        BigDecimal total = tratamientos.stream().map(CitaResponse.TratamientoRef::precio).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CitaResponse(c.getId(),
                new CitaResponse.PersonaRef(c.getPaciente().getId(), up.getNombreCompleto(), up.getEmail(), up.getTelefono(), up.getAvatarUrl()),
                new CitaResponse.DentistaRef(d.getId(), d.getUsuario().getNombreCompleto(), d.getConsultorio()),
                c.getFechaHora(), c.getFin(), c.getDuracionMin(), c.getEstado().name(), c.getOrigen().name(),
                c.getMotivo(), c.getMotivoRechazo(), tratamientos, total, c.getCreadoEn());
    }

    public static NotaEvolucionResponse nota(NotaEvolucion n) {
        return new NotaEvolucionResponse(n.getId(), n.getCita() == null ? null : n.getCita().getId(),
                n.getDentista().getUsuario().getNombreCompleto(), n.getMotivoConsulta(), n.getDiagnostico(),
                n.getTratamientoRealizado(), n.getPronostico(), n.getIndicaciones(), n.getCreadoEn());
    }

    public static OdontogramaResponse odontograma(OdontogramaRegistro r) {
        return new OdontogramaResponse(r.getId(), r.getPieza(), r.getEstado().name(), r.getObservacion(),
                r.getDentista().getUsuario().getNombreCompleto(), r.getCreadoEn());
    }

    public static NotificacionResponse notificacion(Notificacion n) {
        return new NotificacionResponse(n.getId(), n.getCanal().name(), n.getDestino(), n.getAsunto(), n.getEstado(),
                n.getError(), n.getCitaId(), n.getCreadoEn());
    }
}
