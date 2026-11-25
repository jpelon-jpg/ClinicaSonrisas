package com.sonrisas.backend.service;

import com.sonrisas.backend.dto.DashboardDto;
import com.sonrisas.backend.dto.DashboardDto.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    // Cupo mensual de citas por dentista: parámetro para calcular el % de ocupación
    private static final int CUPO_MENSUAL_POR_DENTISTA = 20;

    private final JdbcTemplate jdbc;

    public DashboardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public DashboardDto obtener() {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioMes = hoy.withDayOfMonth(1).atStartOfDay();
        LocalDateTime inicioMesSig = inicioMes.plusMonths(1);
        LocalDateTime inicioMesAnt = inicioMes.minusMonths(1);

        long citasMes = contar("SELECT COUNT(*) FROM citas WHERE fecha_hora >= ? AND fecha_hora < ?",
                inicioMes, inicioMesSig);
        long citasMesAnt = contar("SELECT COUNT(*) FROM citas WHERE fecha_hora >= ? AND fecha_hora < ?",
                inicioMesAnt, inicioMes);
        long canceladas = contar(
                "SELECT COUNT(*) FROM citas WHERE estado = 'CANCELADA' AND fecha_hora >= ? AND fecha_hora < ?",
                inicioMes, inicioMesSig);
        long activas = contar(
                "SELECT COUNT(*) FROM citas WHERE estado <> 'CANCELADA' AND fecha_hora >= ? AND fecha_hora < ?",
                inicioMes, inicioMesSig);
        long nuevos = contar("""
                SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id = u.rol_id
                WHERE r.nombre = 'PACIENTE' AND u.creado_en >= ? AND u.creado_en < ?""",
                inicioMes, inicioMesSig);

        List<OcupacionDentistaDto> dentistas = ocupacionDentistas(inicioMes, inicioMesSig);
        double ocupacionGlobal = dentistas.isEmpty() ? 0
                : redondear(Math.min(100.0, activas * 100.0 / (dentistas.size() * CUPO_MENSUAL_POR_DENTISTA)));

        double variacion = citasMesAnt == 0 ? 0 : redondear((citasMes - citasMesAnt) * 100.0 / citasMesAnt);
        double pctCancel = citasMes == 0 ? 0 : redondear(canceladas * 100.0 / citasMes);

        return new DashboardDto(
                new ResumenDto(citasMes, variacion, ocupacionGlobal, pctCancel, canceladas, nuevos),
                citasPorSemana(hoy),
                dentistas,
                actividadReciente());
    }

    private List<SemanaDto> citasPorSemana(LocalDate hoy) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        LocalDate lunesActual = hoy.with(DayOfWeek.MONDAY);
        List<SemanaDto> semanas = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime ini = lunesActual.minusWeeks(i).atStartOfDay();
            LocalDateTime fin = ini.plusDays(7);
            long[] r = jdbc.queryForObject("""
                    SELECT COALESCE(SUM(estado = 'ATENDIDA'), 0), COALESCE(SUM(estado = 'CANCELADA'), 0)
                    FROM citas WHERE fecha_hora >= ? AND fecha_hora < ?""",
                    (rs, n) -> new long[]{rs.getLong(1), rs.getLong(2)},
                    Timestamp.valueOf(ini), Timestamp.valueOf(fin));
            semanas.add(new SemanaDto(ini.toLocalDate().format(fmt), r[0], r[1]));
        }
        return semanas;
    }

    private List<OcupacionDentistaDto> ocupacionDentistas(LocalDateTime ini, LocalDateTime fin) {
        return jdbc.query("""
                SELECT CONCAT(u.nombre, ' ', u.apellidos) AS nombre, d.consultorio, COUNT(c.id) AS total
                FROM dentistas d
                JOIN usuarios u ON u.id = d.usuario_id
                LEFT JOIN citas c ON c.dentista_id = d.id AND c.estado <> 'CANCELADA'
                     AND c.fecha_hora >= ? AND c.fecha_hora < ?
                GROUP BY d.id, u.nombre, u.apellidos, d.consultorio
                ORDER BY total DESC""",
                (rs, n) -> new OcupacionDentistaDto(
                        rs.getString("nombre"), rs.getString("consultorio"),
                        redondear(Math.min(100.0, rs.getLong("total") * 100.0 / CUPO_MENSUAL_POR_DENTISTA))),
                Timestamp.valueOf(ini), Timestamp.valueOf(fin));
    }

    private List<ActividadDto> actividadReciente() {
        return jdbc.query("""
                SELECT CONCAT(cr.nombre, ' ', cr.apellidos, ' (', r.nombre, ') registró la cita de ',
                              pu.nombre, ' ', pu.apellidos) AS texto, c.creado_en
                FROM citas c
                JOIN usuarios cr ON cr.id = c.creado_por_id
                JOIN roles r ON r.id = cr.rol_id
                JOIN pacientes p ON p.id = c.paciente_id
                JOIN usuarios pu ON pu.id = p.usuario_id
                ORDER BY c.creado_en DESC, c.id DESC
                LIMIT 5""",
                (rs, n) -> new ActividadDto(rs.getString("texto"),
                        rs.getTimestamp("creado_en").toLocalDateTime()));
    }

    private long contar(String sql, LocalDateTime desde, LocalDateTime hasta) {
        Long n = jdbc.queryForObject(sql, Long.class, Timestamp.valueOf(desde), Timestamp.valueOf(hasta));
        return n == null ? 0 : n;
    }

    private double redondear(double v) {
        return Math.round(v * 10) / 10.0;
    }
}