package com.sonrisa.api.controller;

import com.sonrisa.api.dto.NotificacionResponse;
import com.sonrisa.api.dto.PageResponse;
import com.sonrisa.api.entity.CanalNotificacion;
import com.sonrisa.api.service.NotificacionQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Bitácora de correos, SMS y WhatsApp enviados. */
@RestController
@RequestMapping("/api/notificaciones")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionQueryService service;

    @GetMapping
    public PageResponse<NotificacionResponse> listar(@RequestParam(required = false) CanalNotificacion canal,
                                                     @RequestParam(required = false) String estado,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return service.listar(canal, estado, page, size);
    }
}
