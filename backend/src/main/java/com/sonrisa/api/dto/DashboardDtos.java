package com.sonrisa.api.dto;

import java.util.List;
import java.util.Map;

/** DTOs de los paneles de cada rol. */
public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record AdminDashboard(long citasMes, long citasHoy, long pacientesTotales, long pacientesNuevosMes,
                                 double tasaCancelacion, long pendientesConfirmar, Map<String, Long> citasPorEstado,
                                 List<ConteoDentista> citasPorDentista) {
    }

    public record ConteoDentista(String dentista, long total) {
    }

    public record RecepcionDashboard(long citasHoy, long pendientesConfirmar, long atendidasHoy, List<CitaResponse> proximas) {
    }

    public record DentistaAgenda(String fecha, long total, long atendidas, CitaResponse siguiente, List<CitaResponse> citas) {
    }

    public record PacienteResumen(CitaResponse proximaCita, long citasProximas, long citasAnteriores) {
    }
}
