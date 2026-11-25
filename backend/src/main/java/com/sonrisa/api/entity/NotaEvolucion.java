package com.sonrisa.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Nota de evolución del expediente clínico. Por norma no se edita ni se elimina. */
@Entity
@Table(name = "notas_evolucion")
@Getter
@Setter
@NoArgsConstructor
public class NotaEvolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dentista_id", nullable = false)
    private Dentista dentista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_id")
    private Cita cita;

    @Column(name = "motivo_consulta", nullable = false)
    private String motivoConsulta;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String diagnostico;

    @Column(name = "tratamiento_realizado", nullable = false, columnDefinition = "TEXT")
    private String tratamientoRealizado;

    @Column(length = 255)
    private String pronostico;

    @Column(columnDefinition = "TEXT")
    private String indicaciones;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;
}
