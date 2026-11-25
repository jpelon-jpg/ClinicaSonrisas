package com.sonrisa.api.repository;

import com.sonrisa.api.entity.Tratamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TratamientoRepository extends JpaRepository<Tratamiento, Long>, JpaSpecificationExecutor<Tratamiento> {

    List<Tratamiento> findByActivoTrueOrderByNombreAsc();

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    @Query("select count(c) > 0 from Cita c join c.tratamientos t where t.id = :id")
    boolean estaEnUso(@Param("id") Long id);
}
