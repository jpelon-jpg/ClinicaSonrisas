package com.sonrisa.api.repository;

import com.sonrisa.api.entity.Cita;
import com.sonrisa.api.entity.EstadoCita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CitaRepository extends JpaRepository<Cita, Long>, JpaSpecificationExecutor<Cita> {

    /** Paciente y dentista (con su usuario) en la misma consulta; tratamientos por lote. Evita N+1. */
    @Override
    @EntityGraph(attributePaths = {"paciente.usuario", "dentista.usuario"})
    Page<Cita> findAll(Specification<Cita> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"paciente.usuario", "dentista.usuario"})
    Optional<Cita> findDetalleById(Long id);

    List<Cita> findByDentistaIdAndEstadoInAndFechaHoraBetween(Long dentistaId, Collection<EstadoCita> estados,
                                                              LocalDateTime desde, LocalDateTime hasta);

    List<Cita> findByPacienteIdAndEstadoInAndFechaHoraBetween(Long pacienteId, Collection<EstadoCita> estados,
                                                              LocalDateTime desde, LocalDateTime hasta);

    @EntityGraph(attributePaths = {"paciente.usuario", "dentista.usuario"})
    List<Cita> findByDentistaIdAndFechaHoraBetweenOrderByFechaHoraAsc(Long dentistaId, LocalDateTime desde, LocalDateTime hasta);

    @EntityGraph(attributePaths = {"paciente.usuario", "dentista.usuario"})
    List<Cita> findTop5ByFechaHoraGreaterThanEqualAndEstadoInOrderByFechaHoraAsc(LocalDateTime desde, Collection<EstadoCita> estados);

    @EntityGraph(attributePaths = {"paciente.usuario", "dentista.usuario"})
    Optional<Cita> findFirstByPacienteIdAndFechaHoraGreaterThanEqualAndEstadoInOrderByFechaHoraAsc(
            Long pacienteId, LocalDateTime desde, Collection<EstadoCita> estados);

    @EntityGraph(attributePaths = {"paciente.usuario", "dentista.usuario"})
    List<Cita> findTop10ByPacienteIdOrderByFechaHoraDesc(Long pacienteId);

    long countByFechaHoraBetween(LocalDateTime desde, LocalDateTime hasta);

    long countByFechaHoraBetweenAndEstado(LocalDateTime desde, LocalDateTime hasta, EstadoCita estado);

    long countByFechaHoraBetweenAndEstadoIn(LocalDateTime desde, LocalDateTime hasta, Collection<EstadoCita> estados);

    long countByEstado(EstadoCita estado);

    long countByEstadoAndFechaHoraGreaterThanEqual(EstadoCita estado, LocalDateTime desde);

    long countByPacienteIdAndFechaHoraGreaterThanEqualAndEstadoIn(Long pacienteId, LocalDateTime desde, Collection<EstadoCita> estados);

    long countByPacienteIdAndFechaHoraLessThan(Long pacienteId, LocalDateTime antes);

    boolean existsByDentistaIdAndPacienteId(Long dentistaId, Long pacienteId);

    boolean existsByPacienteId(Long pacienteId);

    @Query("select c.estado, count(c) from Cita c where c.fechaHora between :desde and :hasta group by c.estado")
    List<Object[]> contarPorEstado(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("""
            select concat(u.nombre, ' ', u.apellidos), count(c)
            from Cita c join c.dentista d join d.usuario u
            where c.fechaHora between :desde and :hasta and c.estado <> :excluir
            group by d.id, u.nombre, u.apellidos
            order by count(c) desc
            """)
    List<Object[]> contarPorDentista(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta,
                                     @Param("excluir") EstadoCita excluir);
}
