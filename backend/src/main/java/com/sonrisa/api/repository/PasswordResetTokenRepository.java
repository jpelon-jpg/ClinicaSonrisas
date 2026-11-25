package com.sonrisa.api.repository;

import com.sonrisa.api.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @EntityGraph(attributePaths = "usuario")
    Optional<PasswordResetToken> findByToken(String token);
}
