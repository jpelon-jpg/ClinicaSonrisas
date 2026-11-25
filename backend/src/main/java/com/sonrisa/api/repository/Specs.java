package com.sonrisa.api.repository;

import com.sonrisa.api.entity.*;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Filtros dinámicos (Specification) para la paginación y búsqueda del lado del servidor.
 * Cada método devuelve null cuando el filtro no se envía, así se combinan con allOf.
 */
public final class Specs {

    private Specs() {
    }

    private static String like(String texto) {
        return "%" + texto.trim().toLowerCase() + "%";
    }

    private static boolean vacio(String s) {
        return s == null || s.isBlank();
    }

    // ------------------------------------------------------------- Usuarios
    public static Specification<Usuario> usuarios(String q, NombreRol rol, Boolean activo) {
        List<Specification<Usuario>> filtros = new ArrayList<>();
        if (!vacio(q)) {
            filtros.add((root, query, cb) -> cb.or(
                    cb.like(cb.lower(cb.concat(cb.concat(root.get("nombre"), " "), root.get("apellidos"))), like(q)),
                    cb.like(cb.lower(root.get("email")), like(q))));
        }
        if (rol != null) {
            filtros.add((root, query, cb) -> {
                query.distinct(true);
                Join<Usuario, Rol> roles = root.join("roles", JoinType.INNER);
                return cb.equal(roles.get("nombre"), rol);
            });
        }
        if (activo != null) {
            filtros.add((root, query, cb) -> cb.equal(root.get("activo"), activo));
        }
        return Specification.allOf(filtros);
    }

    // ------------------------------------------------------------ Pacientes
    public static Specification<Paciente> pacientes(String q, String acceso) {
        List<Specification<Paciente>> filtros = new ArrayList<>();
        if (!vacio(q)) {
            filtros.add((root, query, cb) -> {
                Join<Paciente, Usuario> u = root.join("usuario");
                return cb.or(
                        cb.like(cb.lower(cb.concat(cb.concat(u.get("nombre"), " "), u.get("apellidos"))), like(q)),
                        cb.like(cb.lower(u.get("email")), like(q)),
                        cb.like(u.get("telefono"), "%" + q.trim() + "%"));
            });
        }
        if (!vacio(acceso)) {
            filtros.add((root, query, cb) -> {
                Join<Paciente, Usuario> u = root.join("usuario");
                return switch (acceso.toUpperCase()) {
                    case "GOOGLE" -> cb.equal(u.get("proveedor"), ProveedorAuth.GOOGLE);
                    case "FACEBOOK" -> cb.equal(u.get("proveedor"), ProveedorAuth.FACEBOOK);
                    case "CORREO" -> cb.and(cb.equal(u.get("proveedor"), ProveedorAuth.LOCAL), cb.isNotNull(u.get("passwordHash")));
                    case "SIN_ACCESO" -> cb.and(cb.equal(u.get("proveedor"), ProveedorAuth.LOCAL), cb.isNull(u.get("passwordHash")));
                    default -> cb.conjunction();
                };
            });
        }
        return Specification.allOf(filtros);
    }

    // --------------------------------------------------------- Tratamientos
    public static Specification<Tratamiento> tratamientos(String q, Boolean activo) {
        List<Specification<Tratamiento>> filtros = new ArrayList<>();
        if (!vacio(q)) {
            filtros.add((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("nombre")), like(q)),
                    cb.like(cb.lower(root.get("descripcion")), like(q))));
        }
        if (activo != null) {
            filtros.add((root, query, cb) -> cb.equal(root.get("activo"), activo));
        }
        return Specification.allOf(filtros);
    }

    // ---------------------------------------------------------------- Citas
    public static Specification<Cita> citas(String q, EstadoCita estado, Long dentistaId, Long pacienteId,
                                            OrigenCita origen, LocalDate desde, LocalDate hasta) {
        List<Specification<Cita>> filtros = new ArrayList<>();
        if (!vacio(q)) {
            filtros.add((root, query, cb) -> {
                Join<Cita, Paciente> p = root.join("paciente");
                Join<Paciente, Usuario> up = p.join("usuario");
                Join<Cita, Dentista> d = root.join("dentista");
                Join<Dentista, Usuario> ud = d.join("usuario");
                return cb.or(
                        cb.like(cb.lower(cb.concat(cb.concat(up.get("nombre"), " "), up.get("apellidos"))), like(q)),
                        cb.like(cb.lower(cb.concat(cb.concat(ud.get("nombre"), " "), ud.get("apellidos"))), like(q)));
            });
        }
        if (estado != null) {
            filtros.add((root, query, cb) -> cb.equal(root.get("estado"), estado));
        }
        if (dentistaId != null) {
            filtros.add((root, query, cb) -> cb.equal(root.get("dentista").get("id"), dentistaId));
        }
        if (pacienteId != null) {
            filtros.add((root, query, cb) -> cb.equal(root.get("paciente").get("id"), pacienteId));
        }
        if (origen != null) {
            filtros.add((root, query, cb) -> cb.equal(root.get("origen"), origen));
        }
        if (desde != null) {
            filtros.add((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("fechaHora"), desde.atStartOfDay()));
        }
        if (hasta != null) {
            filtros.add((root, query, cb) -> cb.lessThan(root.get("fechaHora"), hasta.plusDays(1).atStartOfDay()));
        }
        return Specification.allOf(filtros);
    }

    // -------------------------------------------------------- Notificaciones
    public static Specification<Notificacion> notificaciones(CanalNotificacion canal, String estado) {
        List<Specification<Notificacion>> filtros = new ArrayList<>();
        if (canal != null) {
            filtros.add((root, query, cb) -> cb.equal(root.get("canal"), canal));
        }
        if (!vacio(estado)) {
            filtros.add((root, query, cb) -> cb.equal(root.get("estado"), estado.toUpperCase()));
        }
        return Specification.allOf(filtros);
    }
}
