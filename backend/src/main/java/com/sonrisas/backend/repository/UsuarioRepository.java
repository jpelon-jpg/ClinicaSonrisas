package com.sonrisas.backend.repository;

import com.sonrisas.backend.model.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @EntityGraph(attributePaths = {"rol", "rol.permisos"})
    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);

    @EntityGraph(attributePaths = "rol")
    @Query("""
        SELECT u FROM Usuario u
        WHERE (LOWER(u.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(u.apellidos) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(u.correo) LIKE LOWER(CONCAT('%', :q, '%')))
        AND (:rol IS NULL OR u.rol.nombre = :rol)
        AND (:activo IS NULL OR u.activo = :activo)
        """)
    Page<Usuario> buscar(@Param("q") String q,
                        @Param("rol") String rol,
                        @Param("activo") Boolean activo,
                        Pageable pageable);


}