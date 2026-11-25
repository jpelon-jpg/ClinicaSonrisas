package com.sonrisa.api.repository;

import com.sonrisa.api.entity.NotaEvolucion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotaEvolucionRepository extends JpaRepository<NotaEvolucion, Long> {

    @EntityGraph(attributePaths = {"dentista.usuario"})
    List<NotaEvolucion> findByPacienteIdOrderByCreadoEnDesc(Long pacienteId);
}
