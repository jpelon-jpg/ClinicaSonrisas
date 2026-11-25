package com.sonrisa.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "dentistas")
@Getter
@Setter
@NoArgsConstructor
public class Dentista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false, length = 100)
    private String especialidad;

    @Column(name = "cedula_profesional", nullable = false, unique = true, length = 20)
    private String cedulaProfesional;

    @Column(nullable = false, length = 50)
    private String consultorio;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio = LocalTime.of(9, 0);

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin = LocalTime.of(19, 0);
}
