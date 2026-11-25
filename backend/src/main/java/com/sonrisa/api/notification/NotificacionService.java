package com.sonrisa.api.notification;

import com.sonrisa.api.config.AppProperties;
import com.sonrisa.api.entity.Cita;
import com.sonrisa.api.entity.Tratamiento;
import com.sonrisa.api.entity.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Arma los mensajes a partir de las entidades (dentro de la transacción) y los entrega
 * a CanalesSender, que los envía de forma asíncrona. Cada método se dispara por una
 * acción real del sistema: confirmar, rechazar, cancelar, recordar, registrar, recuperar.
 */
@Service
public class NotificacionService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'a las' HH:mm 'h'",
            Locale.forLanguageTag("es-MX"));

    private final CanalesSender sender;
    private final AppProperties props;

    public NotificacionService(CanalesSender sender, AppProperties props) {
        this.sender = sender;
        this.props = props;
    }

    private record DatosCita(Long citaId, Long usuarioId, String email, String telefono, String paciente,
                             String dentista, String consultorio, String fecha, String tratamientos) {
    }

    private DatosCita datos(Cita c) {
        Usuario u = c.getPaciente().getUsuario();
        String tratamientos = c.getTratamientos().stream().map(Tratamiento::getNombre).collect(Collectors.joining(", "));
        return new DatosCita(c.getId(), u.getId(), u.getEmail(), u.getTelefono(), u.getNombre(),
                c.getDentista().getUsuario().getNombreCompleto(), c.getDentista().getConsultorio(),
                FECHA.format(c.getFechaHora()), tratamientos);
    }

    /** Al confirmar una cita: correo + SMS + WhatsApp. */
    public void citaConfirmada(Cita cita) {
        DatosCita d = datos(cita);
        String asunto = "Tu cita en Sonrisa está confirmada";
        sender.enviarEmail(d.email(), asunto, plantilla("¡Tu cita está confirmada!", d.paciente(),
                "Te esperamos el <b>" + esc(d.fecha()) + "</b>.",
                filaCita(d), "Si necesitas cambiarla, entra a tu portal o llámanos."), d.usuarioId(), d.citaId());
        String texto = "Sonrisa: Hola " + d.paciente() + ", tu cita de " + d.tratamientos() + " con " + d.dentista()
                + " quedó CONFIRMADA para el " + d.fecha() + " (" + d.consultorio() + ").";
        sender.enviarSms(d.telefono(), asunto, texto, d.usuarioId(), d.citaId());
        sender.enviarWhatsapp(d.telefono(), asunto, "🦷 " + texto + " Responde a este chat si tienes dudas.", d.usuarioId(), d.citaId());
    }

    /** Recordatorio manual desde recepción: correo + SMS + WhatsApp. */
    public void recordatorio(Cita cita) {
        DatosCita d = datos(cita);
        String asunto = "Recordatorio de tu cita en Sonrisa";
        sender.enviarEmail(d.email(), asunto, plantilla("Recordatorio de cita", d.paciente(),
                "Te recordamos tu cita del <b>" + esc(d.fecha()) + "</b>.", filaCita(d),
                "Llega 10 minutos antes. Si no puedes asistir, cancélala desde tu portal."), d.usuarioId(), d.citaId());
        String texto = "Sonrisa: Recordatorio, " + d.paciente() + ". Tu cita es el " + d.fecha() + " con " + d.dentista() + ".";
        sender.enviarSms(d.telefono(), asunto, texto, d.usuarioId(), d.citaId());
        sender.enviarWhatsapp(d.telefono(), asunto, "⏰ " + texto, d.usuarioId(), d.citaId());
    }

    /** Al cancelar una cita: correo + SMS. */
    public void citaCancelada(Cita cita, String motivo) {
        DatosCita d = datos(cita);
        String asunto = "Tu cita en Sonrisa fue cancelada";
        sender.enviarEmail(d.email(), asunto, plantilla("Cita cancelada", d.paciente(),
                "La cita del <b>" + esc(d.fecha()) + "</b> fue cancelada."
                        + (motivo != null ? "<br>Motivo: " + esc(motivo) : ""),
                filaCita(d), "Puedes agendar una nueva cita desde tu portal."), d.usuarioId(), d.citaId());
        sender.enviarSms(d.telefono(), asunto, "Sonrisa: Tu cita del " + d.fecha() + " fue cancelada.", d.usuarioId(), d.citaId());
    }

    /** Al rechazar una solicitud en línea: correo. */
    public void solicitudRechazada(Cita cita, String motivo) {
        DatosCita d = datos(cita);
        sender.enviarEmail(d.email(), "Tu solicitud de cita necesita otro horario", plantilla("No pudimos agendar ese horario",
                d.paciente(), "Tu solicitud para el <b>" + esc(d.fecha()) + "</b> no pudo confirmarse.<br>Motivo: " + esc(motivo),
                filaCita(d), "Entra a tu portal y elige otro horario disponible."), d.usuarioId(), d.citaId());
    }

    /** Alta de paciente por recepción con contraseña temporal. */
    public void credencialesTemporales(Usuario usuario, String passwordTemporal) {
        String link = props.frontendUrl() + "/login?tipo=paciente";
        sender.enviarEmail(usuario.getEmail(), "Tu acceso al portal de Sonrisa", plantilla("Bienvenido a Sonrisa",
                usuario.getNombre(), "Ya puedes agendar y consultar tus citas en línea.",
                "<p><b>Correo:</b> " + esc(usuario.getEmail()) + "<br><b>Contraseña temporal:</b> "
                        + esc(passwordTemporal) + "</p>",
                "Al entrar por primera vez te pediremos cambiarla. <a href=\"" + link + "\">Ir al portal</a>"),
                usuario.getId(), null);
    }

    /** Recuperación de contraseña. */
    public void recuperarPassword(Usuario usuario, String token) {
        String link = props.frontendUrl() + "/restablecer?token=" + token;
        sender.enviarEmail(usuario.getEmail(), "Restablece tu contraseña de Sonrisa", plantilla("Restablecer contraseña",
                usuario.getNombre(), "Recibimos una solicitud para cambiar tu contraseña.",
                "<p><a href=\"" + link + "\" style=\"background:#0F766E;color:#fff;padding:12px 20px;border-radius:8px;"
                        + "text-decoration:none;display:inline-block\">Crear nueva contraseña</a></p>",
                "El enlace vence en 30 minutos. Si no fuiste tú, ignora este correo."), usuario.getId(), null);
    }

    /** Bienvenida tras el auto-registro. */
    public void bienvenida(Usuario usuario) {
        sender.enviarEmail(usuario.getEmail(), "¡Bienvenido a Sonrisa!", plantilla("Tu cuenta está lista", usuario.getNombre(),
                "Gracias por registrarte en Sonrisa Clínica Dental.", "",
                "Desde tu portal puedes agendar citas, ver tu historial y recibir recordatorios."), usuario.getId(), null);
    }

    // ----------------------------------------------------------------- HTML
    private String filaCita(DatosCita d) {
        return "<table style=\"border-collapse:collapse;margin:16px 0\">"
                + fila("Tratamiento", d.tratamientos()) + fila("Dentista", d.dentista())
                + fila("Consultorio", d.consultorio()) + fila("Fecha", d.fecha()) + "</table>";
    }

    private String fila(String k, String v) {
        return "<tr><td style=\"padding:4px 16px 4px 0;color:#64748B\">" + k + "</td><td style=\"padding:4px 0\"><b>"
                + esc(v) + "</b></td></tr>";
    }

    private String plantilla(String titulo, String nombre, String intro, String contenido, String pie) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1E293B\">"
                + "<div style=\"background:#0F766E;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0\">"
                + "<b style=\"font-size:20px\">Sonrisa</b><br><span style=\"font-size:12px\">Clínica dental</span></div>"
                + "<div style=\"border:1px solid #E2E8F0;border-top:0;padding:24px;border-radius:0 0 12px 12px\">"
                + "<h2 style=\"margin-top:0\">" + titulo + "</h2><p>Hola " + esc(nombre) + ",</p><p>" + intro + "</p>"
                + contenido + "<p style=\"color:#64748B;font-size:13px\">" + pie + "</p></div></div>";
    }

    private String esc(String s) {
        return s == null ? "" : HtmlUtils.htmlEscape(s);
    }
}
