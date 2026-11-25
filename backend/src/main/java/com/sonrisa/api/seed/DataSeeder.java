package com.sonrisa.api.seed;

import com.sonrisa.api.entity.*;
import com.sonrisa.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * Datos de prueba. Se ejecuta al arrancar solo si app.seed.enabled=true y la tabla de usuarios está vacía.
 * Las contraseñas se guardan con BCrypt mediante el PasswordEncoder (nunca en texto plano).
 * Los roles y tratamientos los carga la migración V2 de Flyway.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PacienteRepository pacienteRepository;
    private final DentistaRepository dentistaRepository;
    private final TratamientoRepository tratamientoRepository;
    private final CitaRepository citaRepository;
    private final NotaEvolucionRepository notaRepository;
    private final OdontogramaRegistroRepository odontogramaRepository;
    private final NotificacionRepository notificacionRepository;
    private final PasswordEncoder encoder;

    private final Random random = new Random(2026);

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            log.info("Seeder omitido: ya hay usuarios en la base de datos");
            return;
        }
        String admin = encoder.encode("Admin#2026");
        String recep = encoder.encode("Recep#2026");
        String dent = encoder.encode("Dentista#2026");
        String pac = encoder.encode("Paciente#2026");

        // --- personal
        Usuario uAdmin = usuario("Roberto", "Salinas Ortiz", "admin@sonrisa.com", "9511000001", admin, NombreRol.ADMIN);
        Usuario uRecep = usuario("María", "González Pérez", "recepcion@sonrisa.com", "9511000002", recep, NombreRol.RECEPCIONISTA);
        usuario("Daniela", "Cruz Martínez", "recepcion2@sonrisa.com", "9511000003", recep, NombreRol.RECEPCIONISTA);

        Dentista laura = dentista(usuario("Laura", "Ruiz Castillo", "laura.ruiz@sonrisa.com", "9511000004", dent, NombreRol.DENTISTA),
                "Odontología general", "12345678", "Consultorio 1", 9, 17);
        Dentista andres = dentista(usuario("Andrés", "Méndez Luna", "andres.mendez@sonrisa.com", "9511000005", dent, NombreRol.DENTISTA),
                "Ortodoncia", "23456789", "Consultorio 2", 10, 19);
        Dentista patricia = dentista(usuario("Patricia", "Vásquez Reyes", "patricia.vasquez@sonrisa.com", "9511000006", dent, NombreRol.DENTISTA),
                "Endodoncia", "3456789", "Consultorio 3", 9, 15);
        List<Dentista> dentistas = List.of(laura, andres, patricia);

        // --- pacientes
        String[][] datos = {
                {"Sofía", "Hernández López", "sofia.hernandez@example.com", "9512000001", "1995-03-14", "Penicilina", "LOCAL"},
                {"Carlos", "Ramírez Torres", "carlos.ramirez@example.com", "9512000002", "1988-07-02", null, "LOCAL"},
                {"Valeria", "Jiménez Ruiz", "valeria.jimenez@example.com", "9512000003", "2001-11-20", null, "GOOGLE"},
                {"Miguel", "Santiago Cruz", "miguel.santiago@example.com", "9512000004", "1979-01-30", "Látex", "LOCAL"},
                {"Fernanda", "López García", "fernanda.lopez@example.com", "9512000005", "1999-05-09", null, "FACEBOOK"},
                {"José", "Martínez Aquino", "jose.martinez@example.com", "9512000006", "1965-09-12", "Ibuprofeno", "LOCAL"},
                {"Ana", "Morales Vásquez", "ana.morales@example.com", "9512000007", "1992-12-01", null, "LOCAL"},
                {"Luis", "Pérez Mendoza", "luis.perez@example.com", "9512000008", "2004-04-18", null, "GOOGLE"},
                {"Gabriela", "Reyes Ortiz", "gabriela.reyes@example.com", "9512000009", "1985-08-25", null, "LOCAL"},
                {"Diego", "Castillo Díaz", "diego.castillo@example.com", "9512000010", "1997-02-14", "Lidocaína con epinefrina", "LOCAL"},
                {"Camila", "Vargas Sánchez", "camila.vargas@example.com", "9512000011", "2010-06-06", null, "LOCAL"},
                {"Ricardo", "Flores Bautista", "ricardo.flores@example.com", "9512000012", "1972-10-10", null, "SIN_ACCESO"},
        };
        List<Paciente> pacientes = new ArrayList<>();
        for (String[] d : datos) {
            boolean social = d[6].equals("GOOGLE") || d[6].equals("FACEBOOK");
            String hash = social || d[6].equals("SIN_ACCESO") ? null : pac;
            Usuario u = usuario(d[0], d[1], d[2], d[3], hash, NombreRol.PACIENTE);
            if (social) {
                u.setProveedor(ProveedorAuth.valueOf(d[6]));
                u.setProveedorId(d[6].toLowerCase() + "-" + u.getId());
            }
            Paciente p = new Paciente();
            p.setUsuario(u);
            p.setFechaNacimiento(LocalDate.parse(d[4]));
            p.setAlergias(d[5]);
            p.setAntecedentes(random.nextBoolean() ? "Sin antecedentes patológicos relevantes" : "Hipertensión controlada");
            p.setContactoEmergencia("Familiar · 951" + (3000000 + random.nextInt(999999)));
            pacientes.add(pacienteRepository.save(p));
        }

        // --- citas (-10 a +10 días respecto a hoy)
        List<Tratamiento> tratamientos = tratamientoRepository.findByActivoTrueOrderByNombreAsc();
        LocalDate hoy = LocalDate.now();
        List<Cita> citas = new ArrayList<>();
        int[] offsets = {-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 2, 3, 4, 5};
        for (int i = 0; i < offsets.length; i++) {
            LocalDate dia = hoy.plusDays(offsets[i]);
            if (dia.getDayOfWeek() == DayOfWeek.SUNDAY) dia = dia.plusDays(1);
            Dentista d = dentistas.get(i % 3);
            LocalTime hora = d.getHoraInicio().plusHours(i % 5).plusMinutes(i % 2 == 0 ? 0 : 30);
            Paciente p = pacientes.get(i % pacientes.size());
            Tratamiento t = tratamientos.get(i % tratamientos.size());

            Cita c = new Cita();
            c.setPaciente(p);
            c.setDentista(d);
            c.setFechaHora(dia.atTime(hora));
            c.getTratamientos().add(t);
            c.setDuracionMin(Math.max(30, t.getDuracionMin()));
            c.setMotivo(MOTIVOS[i % MOTIVOS.length]);
            boolean enLinea = i % 4 == 0;
            c.setOrigen(enLinea ? OrigenCita.EN_LINEA : OrigenCita.RECEPCION);
            c.setCreadoPor(enLinea ? p.getUsuario() : uRecep);
            if (offsets[i] < 0) {
                c.setEstado(i % 7 == 3 ? EstadoCita.NO_ASISTIO : i % 9 == 4 ? EstadoCita.CANCELADA : EstadoCita.ATENDIDA);
            } else if (enLinea) {
                c.setEstado(i % 8 == 0 ? EstadoCita.PENDIENTE : EstadoCita.CONFIRMADA);
                if (i == 28) c.setEstado(EstadoCita.PENDIENTE);
            } else {
                c.setEstado(EstadoCita.CONFIRMADA);
            }
            if (i == 24) {
                c.setEstado(EstadoCita.RECHAZADA);
                c.setMotivoRechazo("El dentista no está disponible ese día; por favor elige otra fecha");
            }
            // evita traslapes en el mismo dentista y día
            boolean choca = citas.stream().anyMatch(o -> o.getDentista() == d && o.getFechaHora().isBefore(c.getFin())
                    && o.getFin().isAfter(c.getFechaHora()));
            if (choca) c.setFechaHora(c.getFechaHora().plusHours(2));
            citas.add(citaRepository.save(c));
        }

        // --- notas de evolución (solo citas atendidas)
        List<Cita> atendidas = citas.stream().filter(c -> c.getEstado() == EstadoCita.ATENDIDA).toList();
        for (int i = 0; i < atendidas.size() && i < 12; i++) {
            Cita c = atendidas.get(i);
            NotaEvolucion n = new NotaEvolucion();
            n.setPaciente(c.getPaciente());
            n.setDentista(c.getDentista());
            n.setCita(c);
            n.setMotivoConsulta(c.getMotivo());
            n.setDiagnostico(DIAGNOSTICOS[i % DIAGNOSTICOS.length]);
            n.setTratamientoRealizado(c.getTratamientos().iterator().next().getNombre());
            n.setPronostico(i % 3 == 0 ? "Reservado" : "Favorable");
            n.setIndicaciones("Cepillado 3 veces al día, uso de hilo dental. Evitar alimentos duros por 24 h.");
            notaRepository.save(n);
        }
        // si hubo pocas atendidas, completa con notas sobre los primeros pacientes
        for (int i = (int) notaRepository.count(); i < 12; i++) {
            Cita c = citas.get(i);
            NotaEvolucion n = new NotaEvolucion();
            n.setPaciente(c.getPaciente());
            n.setDentista(c.getDentista());
            n.setMotivoConsulta("Revisión general");
            n.setDiagnostico(DIAGNOSTICOS[i % DIAGNOSTICOS.length]);
            n.setTratamientoRealizado("Exploración y diagnóstico");
            n.setPronostico("Favorable");
            n.setIndicaciones("Acudir a su siguiente cita programada.");
            notaRepository.save(n);
        }

        // --- odontograma (FDI)
        int[] piezas = {16, 26, 36, 46, 11, 21, 18, 38, 47, 14, 24, 35, 45, 12, 37};
        EstadoPieza[] estados = {EstadoPieza.CARIES, EstadoPieza.RESINA, EstadoPieza.AMALGAMA, EstadoPieza.ENDODONCIA,
                EstadoPieza.SANA, EstadoPieza.CORONA, EstadoPieza.AUSENTE, EstadoPieza.POR_EXTRAER, EstadoPieza.IMPLANTE};
        for (int i = 0; i < piezas.length; i++) {
            Cita c = citas.get(i);
            OdontogramaRegistro r = new OdontogramaRegistro();
            r.setPaciente(c.getPaciente());
            r.setDentista(c.getDentista());
            r.setPieza(piezas[i]);
            r.setEstado(estados[i % estados.length]);
            r.setObservacion("Registrado en consulta del " + c.getFechaHora().toLocalDate());
            odontogramaRepository.save(r);
        }

        // --- bitácora de notificaciones de ejemplo
        CanalNotificacion[] canales = CanalNotificacion.values();
        for (int i = 0; i < 12; i++) {
            Cita c = citas.get(10 + i);
            Usuario u = c.getPaciente().getUsuario();
            Notificacion n = new Notificacion();
            n.setUsuarioId(u.getId());
            n.setCitaId(c.getId());
            n.setCanal(canales[i % 3]);
            n.setDestino(n.getCanal() == CanalNotificacion.EMAIL ? u.getEmail() : "+52" + u.getTelefono());
            n.setAsunto("Cita confirmada");
            n.setEstado(i % 5 == 4 ? "FALLIDA" : "ENVIADA");
            n.setError(i % 5 == 4 ? "Número no verificado en la cuenta de prueba de Twilio" : null);
            notificacionRepository.save(n);
        }

        log.info("Seeder: {} usuarios, {} pacientes, {} citas, {} notas, {} registros de odontograma. Admin: {}",
                usuarioRepository.count(), pacientes.size(), citas.size(), notaRepository.count(),
                odontogramaRepository.count(), uAdmin.getEmail());
    }

    private static final String[] MOTIVOS = {
            "Limpieza semestral", "Dolor en muela inferior derecha", "Revisión de brackets", "Sensibilidad al frío",
            "Valoración para blanqueamiento", "Encía inflamada", "Revisión general", "Diente fracturado"};

    private static final String[] DIAGNOSTICOS = {
            "Caries de esmalte en pieza 16", "Gingivitis leve generalizada", "Pulpitis irreversible en pieza 46",
            "Maloclusión clase II", "Sin hallazgos patológicos", "Fractura coronal no complicada en pieza 21"};

    private Usuario usuario(String nombre, String apellidos, String email, String tel, String hash, NombreRol rol) {
        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setApellidos(apellidos);
        u.setEmail(email);
        u.setTelefono(tel);
        u.setPasswordHash(hash);
        u.getRoles().add(rolRepository.findByNombre(rol).orElseThrow());
        return usuarioRepository.save(u);
    }

    private Dentista dentista(Usuario u, String especialidad, String cedula, String consultorio, int desde, int hasta) {
        Dentista d = new Dentista();
        d.setUsuario(u);
        d.setEspecialidad(especialidad);
        d.setCedulaProfesional(cedula);
        d.setConsultorio(consultorio);
        d.setHoraInicio(LocalTime.of(desde, 0));
        d.setHoraFin(LocalTime.of(hasta, 0));
        return dentistaRepository.save(d);
    }

}
