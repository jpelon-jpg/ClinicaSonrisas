package com.sonrisa.api.notification;

import com.sonrisa.api.config.AppProperties;
import com.sonrisa.api.entity.CanalNotificacion;
import com.sonrisa.api.entity.Notificacion;
import com.sonrisa.api.repository.NotificacionRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/**
 * Envío real por cada canal. Los métodos son @Async para no hacer esperar al usuario
 * y cada intento queda registrado en la tabla "notificaciones".
 */
@Component
public class CanalesSender {

    private static final Logger log = LoggerFactory.getLogger(CanalesSender.class);

    private final JavaMailSender mailSender;
    private final NotificacionRepository notificacionRepository;
    private final AppProperties props;
    private final WhatsappMetaClient whatsappMeta;
    private final RestClient twilio;

    public CanalesSender(JavaMailSender mailSender, NotificacionRepository notificacionRepository,
                         AppProperties props, WhatsappMetaClient whatsappMeta) {
        this.mailSender = mailSender;
        this.notificacionRepository = notificacionRepository;
        this.props = props;
        this.whatsappMeta = whatsappMeta;
        this.twilio = RestClient.builder()
                .baseUrl("https://api.twilio.com/2010-04-01")
                .defaultHeaders(h -> h.setBasicAuth(props.twilio().accountSid(), props.twilio().authToken()))
                .build();
    }

    /** Correo HTML a través del servidor Postfix local del VPS. */
    @Async
    public void enviarEmail(String para, String asunto, String html, Long usuarioId, Long citaId) {
        if (!props.notificaciones().email().enabled() || para == null || para.isBlank()) {
            registrar(CanalNotificacion.EMAIL, para, asunto, "OMITIDA", "Canal deshabilitado o sin destinatario", usuarioId, citaId);
            return;
        }
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(props.mail().from());
            helper.setTo(para);
            helper.setSubject(asunto);
            helper.setText(html, true);
            mailSender.send(mensaje);
            registrar(CanalNotificacion.EMAIL, para, asunto, "ENVIADA", null, usuarioId, citaId);
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo a {}: {}", para, e.getMessage());
            registrar(CanalNotificacion.EMAIL, para, asunto, "FALLIDA", e.getMessage(), usuarioId, citaId);
        }
    }

    /** SMS con la API de Twilio. */
    @Async
    public void enviarSms(String telefono, String asunto, String texto, Long usuarioId, Long citaId) {
        String destino = Telefonos.e164(telefono);
        if (!props.notificaciones().sms().enabled() || destino == null) {
            registrar(CanalNotificacion.SMS, telefono == null ? "-" : telefono, asunto, "OMITIDA",
                    "Canal deshabilitado o teléfono inválido", usuarioId, citaId);
            return;
        }
        enviarTwilio(CanalNotificacion.SMS, destino, props.twilio().smsFrom(), asunto, texto, usuarioId, citaId);
    }

    /** WhatsApp: usa la Cloud API de Meta si está configurada; si no, Twilio (sandbox). */
    @Async
    public void enviarWhatsapp(String telefono, String asunto, String texto, Long usuarioId, Long citaId) {
        String destino = Telefonos.whatsapp(telefono);
        if (!props.notificaciones().whatsapp().enabled() || destino == null) {
            registrar(CanalNotificacion.WHATSAPP, telefono == null ? "-" : telefono, asunto, "OMITIDA",
                    "Canal deshabilitado o teléfono inválido", usuarioId, citaId);
            return;
        }
        if (whatsappMeta.configurado()) {
            String numero = Telefonos.e164(telefono);
            try {
                whatsappMeta.enviar(numero, texto);
                registrar(CanalNotificacion.WHATSAPP, numero, asunto, "ENVIADA", null, usuarioId, citaId);
            } catch (Exception e) {
                log.warn("No se pudo enviar WhatsApp (Meta) a {}: {}", numero, e.getMessage());
                registrar(CanalNotificacion.WHATSAPP, numero, asunto, "FALLIDA", e.getMessage(), usuarioId, citaId);
            }
            return;
        }
        enviarTwilio(CanalNotificacion.WHATSAPP, destino, props.twilio().whatsappFrom(), asunto, texto, usuarioId, citaId);
    }

    private void enviarTwilio(CanalNotificacion canal, String to, String from, String asunto, String texto,
                              Long usuarioId, Long citaId) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("To", to);
            form.add("From", from);

            // Cuenta de prueba de Twilio: el SMS solo admite una plantilla predefinida y el WhatsApp un ContentSid.
            // Con una cuenta mejorada se dejan vacías estas propiedades y se envía el texto propio.
            String plantillaSms = props.twilio().smsTemplate();
            String contentSid = props.twilio().whatsappContentSid();
            if (canal == CanalNotificacion.SMS && plantillaSms != null && !plantillaSms.isBlank()) {
                form.add("Body", plantillaSms);
            } else if (canal == CanalNotificacion.WHATSAPP && contentSid != null && !contentSid.isBlank()) {
                form.add("ContentSid", contentSid);
            } else {
                form.add("Body", texto);
            }

            twilio.post()
                    .uri("/Accounts/{sid}/Messages.json", props.twilio().accountSid())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
            registrar(canal, to, asunto, "ENVIADA", null, usuarioId, citaId);
        } catch (Exception e) {
            log.warn("No se pudo enviar {} a {}: {}", canal, to, e.getMessage());
            registrar(canal, to, asunto, "FALLIDA", e.getMessage(), usuarioId, citaId);
        }
    }

    private void registrar(CanalNotificacion canal, String destino, String asunto, String estado, String error,
                           Long usuarioId, Long citaId) {
        try {
            Notificacion n = new Notificacion();
            n.setCanal(canal);
            n.setDestino(destino == null ? "-" : destino);
            n.setAsunto(asunto.length() > 150 ? asunto.substring(0, 150) : asunto);
            n.setEstado(estado);
            n.setError(error == null ? null : (error.length() > 500 ? error.substring(0, 500) : error));
            n.setUsuarioId(usuarioId);
            n.setCitaId(citaId);
            notificacionRepository.save(n);
        } catch (Exception e) {
            log.error("No se pudo registrar la notificación", e);
        }
    }
}