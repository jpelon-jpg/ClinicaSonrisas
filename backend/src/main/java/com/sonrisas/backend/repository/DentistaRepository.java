package com.sonrisas.backend.repository;

import com.sonrisas.backend.model.Dentista;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DentistaRepository extends JpaRepository<Dentista, Long> {
    void deleteByUsuarioId(Long usuarioId);
}