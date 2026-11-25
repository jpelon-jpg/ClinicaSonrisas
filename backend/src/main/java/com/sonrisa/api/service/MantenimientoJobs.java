package com.sonrisa.api.service;

import com.sonrisa.api.entity.Cita;
import com.sonrisa.api.entity.EstadoCita;
import com.sonrisa.api.notification.NotificacionService;
import com.sonrisa.api.repository.CitaRepository;
import com.sonrisa.api.repository.Specs;
import com.sonrisa.api.repository.TokenRevocadoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class MantenimientoJobs {

    private final TokenRevocadoRepository tokenRevocadoRepository;
    private final CitaRepository citaRepository;
    private final NotificacionService notificacionService;

    /** Borra cada hora los tokens revocados que ya expiraron. */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void limpiarTokens() {
        int n = tokenRevocadoRepository.eliminarExpirados(LocalDateTime.now());
        if (n > 0) log.info("Tokens revocados eliminados: {}", n);
    }

    /** Todos los días a las 9:00 envía recordatorio de las citas confirmadas de mañana. */
    @Scheduled(cron = "0 0 9 * * *", zone = "America/Mexico_City")
    @Transactional(readOnly = true)
    public void recordatoriosDeManana() {
        LocalDate manana = LocalDate.now().plusDays(1);
        for (Cita c : citaRepository.findAll(Specs.citas(null, EstadoCita.CONFIRMADA, null, null, null, manana, manana),
                Pageable.unpaged())) {
            notificacionService.recordatorio(c);
        }
    }
}
