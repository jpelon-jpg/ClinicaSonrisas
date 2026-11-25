package com.sonrisa.api.repository;

import com.sonrisa.api.entity.Paciente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long>, JpaSpecificationExecutor<Paciente> {

    @Override
    @EntityGraph(attributePaths = "usuario")
    Page<Paciente> findAll(Specification<Paciente> spec, Pageable pageable);

    @EntityGraph(attributePaths = "usuario")
    Optional<Paciente> findWithUsuarioById(Long id);

    @EntityGraph(attributePaths = "usuario")
    Optional<Paciente> findByUsuarioId(Long usuarioId);

    @EntityGraph(attributePaths = "usuario")
    List<Paciente> findAllByOrderByIdAsc();

    long countByUsuarioCreadoEnAfter(LocalDateTime fecha);

    /** Pacientes que han tenido al menos una cita con el dentista (paginado en servidor). */
    @Query(value = """
            select p from Paciente p join fetch p.usuario u
            where exists (select 1 from Cita c where c.paciente = p and c.dentista.id = :dentistaId)
              and (:q is null or lower(concat(u.nombre, ' ', u.apellidos)) like :q or lower(u.email) like :q)
            """,
            countQuery = """
            select count(p) from Paciente p join p.usuario u
            where exists (select 1 from Cita c where c.paciente = p and c.dentista.id = :dentistaId)
              and (:q is null or lower(concat(u.nombre, ' ', u.apellidos)) like :q or lower(u.email) like :q)
            """)
    Page<Paciente> buscarPorDentista(@Param("dentistaId") Long dentistaId, @Param("q") String q, Pageable pageable);
}
