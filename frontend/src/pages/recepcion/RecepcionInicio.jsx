import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { fechaLarga, hora } from '../../utils/format'
import { Badge, Cargando, ErrorEstado, Vacio } from '../../components/Estados'
import CitaFormModal from './CitaFormModal'

export default function RecepcionInicio() {
  const { usuario } = useAuth()
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dashboard/recepcion'))
  const [nueva, setNueva] = useState(false)

  return (
    <div className="pagina">
      <header className="pagina-head">
        <div><h1>Hola, {usuario.nombre}</h1><p className="muted">{fechaLarga(new Date().toISOString())}</p></div>
        <button className="btn btn-primary" onClick={() => setNueva(true)}>＋ Nueva cita</button>
      </header>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> : (
        <>
          <div className="kpis">
            <div className="kpi"><span>Citas de hoy</span><strong>{datos.citasHoy}</strong></div>
            <Link to="/recepcion/solicitudes" className="kpi kpi-alerta"><span>Solicitudes por confirmar</span><strong>{datos.pendientesConfirmar}</strong></Link>
            <div className="kpi"><span>Atendidas hoy</span><strong>{datos.atendidasHoy}</strong></div>
          </div>
          <section className="card">
            <div className="card-head"><h2>Próximas citas confirmadas</h2><Link to="/recepcion/citas" className="link">Ver todas</Link></div>
            {datos.proximas.length === 0 ? <Vacio texto="No hay citas próximas" /> : (
              <ul className="lista">
                {datos.proximas.map((c) => (
                  <li key={c.id} className="lista-item">
                    <div className="hora-col"><strong>{hora(c.fechaHora)}</strong><small>{c.fechaHora.slice(5, 10).split('-').reverse().join('/')}</small></div>
                    <div className="crece"><strong>{c.paciente.nombreCompleto}</strong>
                      <small className="muted">{c.tratamientos.map((t) => t.nombre).join(', ')} · {c.dentista.nombreCompleto}</small></div>
                    <Badge estado={c.estado} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {nueva && <CitaFormModal onClose={() => setNueva(false)} onGuardada={() => { setNueva(false); recargar() }} />}
    </div>
  )
}
