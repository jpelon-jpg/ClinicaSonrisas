package com.sonrisas.backend.repository;

import com.sonrisas.backend.model.TokenRevocado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenRevocadoRepository extends JpaRepository<TokenRevocado, Long> {
    boolean existsByTokenHash(String tokenHash);
}