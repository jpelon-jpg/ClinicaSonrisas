package com.sonrisa.api.service;

import com.sonrisa.api.dto.NotificacionResponse;
import com.sonrisa.api.dto.PageResponse;
import com.sonrisa.api.entity.CanalNotificacion;
import com.sonrisa.api.repository.NotificacionRepository;
import com.sonrisa.api.repository.Specs;
import com.sonrisa.api.util.DtoMapper;
import com.sonrisa.api.util.Paginacion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificacionQueryService {

    private final NotificacionRepository repo;

    @Transactional(readOnly = true)
    public PageResponse<NotificacionResponse> listar(CanalNotificacion canal, String estado, int page, int size) {
        return PageResponse.of(repo.findAll(Specs.notificaciones(canal, estado),
                Paginacion.de(page, size, null, Set.of("creadoEn"), "-creadoEn")), DtoMapper::notificacion);
    }
}
