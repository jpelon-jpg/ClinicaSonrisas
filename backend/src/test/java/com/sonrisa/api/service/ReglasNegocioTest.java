package com.sonrisa.api.service;

import com.sonrisa.api.dto.Validaciones;
import com.sonrisa.api.util.Passwords;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Pruebas unitarias sin base de datos: se ejecutan con "mvn test". */
class ReglasNegocioTest {

    @Test
    void numeracionFdiValida() {
        assertThat(ExpedienteService.piezaValida(11)).isTrue();
        assertThat(ExpedienteService.piezaValida(48)).isTrue();
        assertThat(ExpedienteService.piezaValida(19)).isFalse();
        assertThat(ExpedienteService.piezaValida(50)).isFalse();
        assertThat(ExpedienteService.piezaValida(10)).isFalse();
    }

    @Test
    void politicaDeContrasenas() {
        assertThat("Admin#2026").matches(Validaciones.PASSWORD);
        assertThat("admin2026").doesNotMatch(Validaciones.PASSWORD);   // sin mayúscula ni especial
        assertThat("Admin2026").doesNotMatch(Validaciones.PASSWORD);   // sin especial
        assertThat("Ad#1").doesNotMatch(Validaciones.PASSWORD);        // muy corta
    }

    @Test
    void contrasenaTemporalCumplePolitica() {
        for (int i = 0; i < 50; i++) {
            assertThat(Passwords.temporal()).matches(Validaciones.PASSWORD);
        }
    }
}
