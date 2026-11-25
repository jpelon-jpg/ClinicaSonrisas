import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { dinero, fechaLarga, hora } from '../../utils/format'
import { Badge, Cargando, ErrorEstado } from '../../components/Estados'

export default function PacienteInicio() {
  const { usuario } = useAuth()
  const { datos, cargando, error, recargar } = useApi(() => api.get('/paciente/resumen'))
  const c = datos?.proximaCita

  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>¡Hola, {usuario.nombre}!</h1><p className="muted">Bienvenido a tu portal de Sonrisa</p></div>
        <Link to="/paciente/agendar" className="btn btn-primary">＋ Agendar cita</Link></header>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> : (
        <>
          <section className="card proxima">
            <h2>Tu próxima cita</h2>
            {c ? (
              <div className="proxima-cuerpo">
                <div className="proxima-fecha"><strong className="cap">{fechaLarga(c.fechaHora)}</strong><span>{hora(c.fechaHora)} h</span></div>
                <div className="crece">
                  <p><strong>{c.tratamientos.map((t) => t.nombre).join(', ')}</strong></p>
                  <p className="muted">{c.dentista.nombreCompleto} · {c.dentista.consultorio} · {dinero(c.total)}</p>
                  {c.estado === 'PENDIENTE' && <p className="sm">Recepción revisará tu solicitud y te avisará por correo, SMS y WhatsApp.</p>}
                </div>
                <Badge estado={c.estado} />
              </div>
            ) : <p className="muted">No tienes citas próximas. <Link to="/paciente/agendar" className="link">Agenda una</Link>.</p>}
          </section>
          <div className="kpis">
            <Link to="/paciente/citas" className="kpi"><span>Citas próximas</span><strong>{datos.citasProximas}</strong></Link>
            <Link to="/paciente/citas?tipo=historial" className="kpi"><span>Citas anteriores</span><strong>{datos.citasAnteriores}</strong></Link>
            <Link to="/paciente/expediente" className="kpi"><span>Mi expediente</span><strong className="sm">Ver odontograma y notas ›</strong></Link>
          </div>
        </>
      )}
    </div>
  )
}
