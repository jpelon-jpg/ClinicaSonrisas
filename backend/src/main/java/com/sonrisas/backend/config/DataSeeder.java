package com.sonrisas.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements ApplicationRunner {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;

    public DataSeeder(JdbcTemplate jdbc, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Administrador de evaluación (credenciales fijas del README)
        usuario("Roberto", "Salinas", "admin@sonrisa.com", "Admin#2026", "ADMINISTRADOR", "9510000001");

        Integer ya = jdbc.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE correo = 'recepcion@sonrisa.com'", Integer.class);
        if (ya != null && ya > 0) return; // el seed ya corrió

        // Recepcionistas
        long recep = usuario("María", "González", "recepcion@sonrisa.com", "Recep#2026", "RECEPCIONISTA", "9510000002");
        usuario("Diego", "Santiago", "recepcion2@sonrisa.com", "Sonrisa#2026", "RECEPCIONISTA", "9510000003");

        // Dentistas
        long uLaura = usuario("Laura", "Ruiz", "laura@sonrisa.com", "Laura#2026", "DENTISTA", "9511112222");
        long uAndres = usuario("Andrés", "Méndez", "andres@sonrisa.com", "Dentista#2026", "DENTISTA", "9510000004");
        long uPaola = usuario("Paola", "Cruz", "paola@sonrisa.com", "Sonrisa#2026", "DENTISTA", "9510000005");
        dentista(uLaura, "Ortodoncia", "Consultorio 1");
        dentista(uAndres, "Endodoncia", "Consultorio 2");
        dentista(uPaola, "Odontopediatría", "Consultorio 3");

        // Pacientes (12)
        usuario("Sofía", "Hernández", "paciente@sonrisa.com", "Paciente#2026", "PACIENTE", "9510000006");
        String[][] pacientes = {
            {"Carlos", "Pérez"}, {"Mariana", "Cruz"}, {"José", "García"}, {"Valeria", "Cruz"},
            {"Andrea", "López"}, {"Miguel", "Torres"}, {"Daniela", "Ramírez"}, {"Luis", "Martínez"},
            {"Fernanda", "Ortiz"}, {"Ricardo", "Vásquez"}, {"Camila", "Jiménez"}
        };
        for (int i = 0; i < pacientes.length; i++) {
            usuario(pacientes[i][0], pacientes[i][1], "paciente" + (i + 2) + "@sonrisa.com",
                    "Sonrisa#2026", "PACIENTE", "95100001" + String.format("%02d", i));
        }
        jdbc.update("""
            INSERT IGNORE INTO pacientes (usuario_id)
            SELECT u.id FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE r.nombre = 'PACIENTE'""");

        // Tratamientos (12)
        Object[][] trat = {
            {"Limpieza dental", 600, 30}, {"Resina (empaste)", 900, 45}, {"Extracción simple", 800, 30},
            {"Endodoncia", 3500, 90}, {"Blanqueamiento", 2800, 60}, {"Corona dental", 4500, 60},
            {"Ortodoncia (mensualidad)", 1200, 30}, {"Consulta de valoración", 300, 20},
            {"Radiografía panorámica", 500, 15}, {"Sellador de fosas", 450, 30},
            {"Profilaxis infantil", 500, 30}, {"Retiro de brackets", 1500, 45}
        };
        for (Object[] t : trat) {
            jdbc.update("INSERT INTO tratamientos (nombre, precio, duracion_min) VALUES (?, ?, ?)",
                    t[0], new BigDecimal((Integer) t[1]), t[2]);
        }

        // Citas (30) con sus tratamientos (N:M) y notas clínicas
        List<Long> pacienteIds = jdbc.queryForList("SELECT id FROM pacientes ORDER BY id", Long.class);
        List<Long> dentistaIds = jdbc.queryForList("SELECT id FROM dentistas ORDER BY id", Long.class);
        List<Map<String, Object>> tratIds = jdbc.queryForList("SELECT id, precio FROM tratamientos ORDER BY id");

        int notas = 0;
        for (int i = 0; i < 30; i++) {
            int offset = i - 20;
            String estado = offset < 0 ? (i % 5 == 0 ? "CANCELADA" : "ATENDIDA") : "PROGRAMADA";
            LocalDateTime fecha = LocalDateTime.now().plusDays(offset)
                    .withHour(9 + (i % 8)).withMinute(0).withSecond(0).withNano(0);
            long pac = pacienteIds.get(i % pacienteIds.size());
            long den = dentistaIds.get(i % dentistaIds.size());

            long citaId = insertarCita(pac, den, fecha, estado, "Consulta " + (i + 1), recep);

            for (int k = 0; k < 1 + (i % 2); k++) {
                Map<String, Object> t = tratIds.get((i + k * 3) % tratIds.size());
                jdbc.update("INSERT IGNORE INTO cita_tratamiento (cita_id, tratamiento_id, precio_aplicado) VALUES (?, ?, ?)",
                        citaId, t.get("id"), t.get("precio"));
            }
            if ("ATENDIDA".equals(estado) && notas < 10) {
                jdbc.update("INSERT INTO notas_clinicas (cita_id, dentista_id, nota) VALUES (?, ?, ?)",
                        citaId, den, "Paciente atendido sin complicaciones. Se recomienda seguimiento en 6 meses.");
                notas++;
            }
        }
    }

    private long usuario(String nombre, String apellidos, String correo, String pass, String rol, String tel) {
        Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM usuarios WHERE correo = ?", Integer.class, correo);
        if (existe == null || existe == 0) {
            jdbc.update("""
                INSERT INTO usuarios (nombre, apellidos, correo, password_hash, telefono, rol_id)
                SELECT ?, ?, ?, ?, ?, id FROM roles WHERE nombre = ?""",
                    nombre, apellidos, correo, encoder.encode(pass), tel, rol);
        }
        return jdbc.queryForObject("SELECT id FROM usuarios WHERE correo = ?", Long.class, correo);
    }

    private void dentista(long usuarioId, String especialidad, String consultorio) {
        jdbc.update("INSERT IGNORE INTO dentistas (usuario_id, especialidad, consultorio) VALUES (?, ?, ?)",
                usuarioId, especialidad, consultorio);
        jdbc.update("UPDATE dentistas SET especialidad = ?, consultorio = ? WHERE usuario_id = ?",
                especialidad, consultorio, usuarioId);
    }

    private long insertarCita(long pac, long den, LocalDateTime fecha, String estado, String motivo, long creadoPor) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                INSERT INTO citas (paciente_id, dentista_id, fecha_hora, estado, motivo, creado_por_id)
                VALUES (?, ?, ?, ?, ?, ?)""", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, pac);
            ps.setLong(2, den);
            ps.setTimestamp(3, Timestamp.valueOf(fecha));
            ps.setString(4, estado);
            ps.setString(5, motivo);
            ps.setLong(6, creadoPor);
            return ps;
        }, kh);
        return kh.getKey().longValue();
    }
}