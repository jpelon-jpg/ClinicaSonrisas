package com.sonrisa.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "odontograma_registros")
@Getter
@Setter
@NoArgsConstructor
public class OdontogramaRegistro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dentista_id", nullable = false)
    private Dentista dentista;

    /** Numeración FDI: 11-18, 21-28, 31-38, 41-48. */
    @Column(nullable = false)
    private Integer pieza;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPieza estado;

    @Column(length = 255)
    private String observacion;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;
}
