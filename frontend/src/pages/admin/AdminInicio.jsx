import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { ESTADOS_CITA } from '../../utils/format'
import { Cargando, ErrorEstado } from '../../components/Estados'

export default function AdminInicio() {
  const { datos: d, cargando, error, recargar } = useApi(() => api.get('/dashboard/admin'))
  if (error) return <div className="pagina"><ErrorEstado error={error} onRetry={recargar} /></div>
  if (cargando && !d) return <div className="pagina"><Cargando /></div>
  const maxDent = Math.max(1, ...d.citasPorDentista.map((x) => x.total))
  const totalEstados = Math.max(1, Object.values(d.citasPorEstado).reduce((a, b) => a + b, 0))

  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>Panel de administración</h1><p className="muted">Resumen del mes en curso</p></div></header>
      <div className="kpis">
        <div className="kpi"><span>Citas del mes</span><strong>{d.citasMes}</strong></div>
        <div className="kpi"><span>Citas de hoy</span><strong>{d.citasHoy}</strong></div>
        <div className="kpi"><span>Pacientes</span><strong>{d.pacientesTotales}</strong><small>+{d.pacientesNuevosMes} este mes</small></div>
        <div className="kpi"><span>Cancelación / inasistencia</span><strong>{d.tasaCancelacion}%</strong></div>
        <div className="kpi kpi-alerta"><span>Por confirmar</span><strong>{d.pendientesConfirmar}</strong></div>
      </div>
      <div className="grid-2 alto">
        <section className="card">
          <h2>Citas por dentista</h2>
          <ul className="barras">
            {d.citasPorDentista.map((x) => (
              <li key={x.dentista}><span className="barra-etq">{x.dentista}</span>
                <span className="barra"><span style={{ width: `${(x.total / maxDent) * 100}%` }} /></span><strong>{x.total}</strong></li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Citas por estado</h2>
          <ul className="barras">
            {Object.entries(d.citasPorEstado).map(([k, n]) => (
              <li key={k}><span className="barra-etq">{ESTADOS_CITA[k]?.texto || k}</span>
                <span className={`barra barra-${ESTADOS_CITA[k]?.clase}`}><span style={{ width: `${(n / totalEstados) * 100}%` }} /></span><strong>{n}</strong></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
