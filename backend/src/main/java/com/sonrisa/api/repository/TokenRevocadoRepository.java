package com.sonrisa.api.repository;

import com.sonrisa.api.entity.TokenRevocado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface TokenRevocadoRepository extends JpaRepository<TokenRevocado, String> {

    @Modifying
    @Query("delete from TokenRevocado t where t.expiraEn < :fecha")
    int eliminarExpirados(@Param("fecha") LocalDateTime fecha);
}
