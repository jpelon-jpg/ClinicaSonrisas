package com.sonrisa.api.repository;

import com.sonrisa.api.entity.Dentista;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DentistaRepository extends JpaRepository<Dentista, Long> {

    @EntityGraph(attributePaths = "usuario")
    List<Dentista> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = "usuario")
    Optional<Dentista> findWithUsuarioById(Long id);

    @EntityGraph(attributePaths = "usuario")
    Optional<Dentista> findByUsuarioId(Long usuarioId);

    boolean existsByCedulaProfesionalAndIdNot(String cedula, Long id);

    boolean existsByCedulaProfesional(String cedula);
}
