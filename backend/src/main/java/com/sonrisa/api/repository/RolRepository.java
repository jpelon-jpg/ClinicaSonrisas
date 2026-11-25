package com.sonrisa.api.repository;

import com.sonrisa.api.entity.NombreRol;
import com.sonrisa.api.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByNombre(NombreRol nombre);

    @Query("select count(u) from Usuario u join u.roles r where r.id = :rolId")
    long contarUsuarios(@Param("rolId") Long rolId);
}
