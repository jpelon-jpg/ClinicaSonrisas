package com.sonrisa.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "tokens_revocados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TokenRevocado {

    @Id
    @Column(length = 64)
    private String jti;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;
}
