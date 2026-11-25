package com.sonrisa.api.repository;

import com.sonrisa.api.entity.OdontogramaRegistro;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OdontogramaRegistroRepository extends JpaRepository<OdontogramaRegistro, Long> {

    @EntityGraph(attributePaths = {"dentista.usuario"})
    List<OdontogramaRegistro> findByPacienteIdOrderByCreadoEnDescIdDesc(Long pacienteId);

    @EntityGraph(attributePaths = {"dentista.usuario"})
    List<OdontogramaRegistro> findByPacienteIdAndPiezaOrderByCreadoEnDescIdDesc(Long pacienteId, Integer pieza);
}
