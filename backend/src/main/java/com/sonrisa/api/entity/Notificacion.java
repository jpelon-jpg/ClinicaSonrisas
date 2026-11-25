package com.sonrisa.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Getter
@Setter
@NoArgsConstructor
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "cita_id")
    private Long citaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CanalNotificacion canal;

    @Column(nullable = false, length = 150)
    private String destino;

    @Column(nullable = false, length = 150)
    private String asunto;

    /** ENVIADA, FALLIDA u OMITIDA (canal deshabilitado o sin destino). */
    @Column(nullable = false, length = 20)
    private String estado;

    @Column(length = 500)
    private String error;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;
}
