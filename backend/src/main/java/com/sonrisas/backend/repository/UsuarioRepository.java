package com.sonrisas.backend.repository;

import com.sonrisas.backend.model.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @EntityGraph(attributePaths = {"rol", "rol.permisos"})
    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);
}