import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { ESTADOS_CITA, fechaHora } from '../../utils/format'
import { Avatar, Cargando, Encabezado, ErrorEstado, Kpi } from '../../components/Estados'
import Icono from '../../components/Icono'

const COLOR_ESTADO = { PENDIENTE: '#F59E0B', CONFIRMADA: '#5EAAA0', ATENDIDA: '#0F766E', CANCELADA: '#FCA5A5', NO_ASISTIO: '#F87171', RECHAZADA: '#CBD5E1' }
const ICONO_CANAL = { EMAIL: 'correo', SMS: 'telefono', WHATSAPP: 'enviar' }

export default function AdminInicio() {
  const { datos: d, cargando, error, recargar } = useApi(() => api.get('/dashboard/admin'))
  const { datos: actividad } = useApi(() => api.get('/notificaciones', { page: 0, size: 5 }))
  if (error) return <div className="pagina"><ErrorEstado error={error} onRetry={recargar} /></div>
  if (cargando && !d) return <div className="pagina"><Cargando /></div>

  const mes = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  const totalDent = Math.max(1, d.citasPorDentista.reduce((a, x) => a + x.total, 0))
  const estados = Object.entries(d.citasPorEstado)
  const maxEstado = Math.max(1, ...estados.map(([, n]) => n))
  const escala = [maxEstado, Math.round(maxEstado * 0.75), Math.round(maxEstado * 0.5), Math.round(maxEstado * 0.25), 0]

  return (
    <div className="pagina">
      <Encabezado titulo="Resumen de la clínica" subtitulo={`${mes.charAt(0).toUpperCase() + mes.slice(1)} · Indicadores generales de la operación.`} />
      <div className="kpis">
        <Kpi icono={<Icono nombre="calendario" />} titulo="Citas del mes" detalle={{ texto: `${d.citasHoy} programadas hoy`, tono: 'ok' }} valor={d.citasMes} />
        <Kpi icono={<Icono nombre="reloj" />} tono="ambar" titulo="Por confirmar" detalle="Solicitudes en línea" valor={d.pendientesConfirmar} to="/recepcion/solicitudes" />
        <Kpi icono={<Icono nombre="xCirculo" />} tono="rojo" titulo="Cancelaciones" detalle="Canceladas o inasistencias" valor={`${d.tasaCancelacion}%`} />
        <Kpi icono={<Icono nombre="usuarioMas" />} tono="morado" titulo="Pacientes nuevos" detalle={`${d.pacientesTotales} pacientes en total`} valor={d.pacientesNuevosMes} />
      </div>

      <div className="dos-col">
        <section className="card">
          <div className="card-head"><div><h2>Citas por estado</h2><p>Todas las citas del mes en curso</p></div></div>
          <div className="grafica">
            <div className="grafica-eje">{escala.map((v, i) => <span key={i}>{v}</span>)}</div>
            <div className="grafica-area">
              {escala.map((_, i) => <i key={i} className="grafica-linea" style={{ top: `${i * 25}%` }} />)}
              {estados.map(([k, n]) => (
                <div key={k} className="grafica-col" title={`${ESTADOS_CITA[k]?.texto}: ${n}`}>
                  <span className="grafica-num">{n}</span>
                  <span className="grafica-barra" style={{ height: `${(n / maxEstado) * 100}%`, background: COLOR_ESTADO[k] }} />
                  <small>{ESTADOS_CITA[k]?.texto || k}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Citas por dentista</h2><p>Proporción de citas del mes</p></div></div>
          <ul className="barras">
            {d.citasPorDentista.map((x) => {
              const pct = Math.round((x.total / totalDent) * 100)
              return (
                <li key={x.dentista} className="barra-dentista">
                  <Avatar nombre={x.dentista} size={40} />
                  <div><strong>{x.dentista}</strong><small className="block muted">{x.total} citas</small></div>
                  <span className="pct">{pct}%</span>
                  <span className="barra"><span style={{ width: `${pct}%` }} /></span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><div><h2>Actividad reciente</h2><p>Últimos avisos enviados a pacientes</p></div></div>
        {!actividad?.content?.length ? <p className="muted">Aún no hay avisos enviados.</p> : (
          <ul className="lista">
            {actividad.content.map((n) => (
              <li key={n.id} className="lista-item">
                <span className="tile sm tile-menta"><Icono nombre={ICONO_CANAL[n.canal] || 'campana'} size={18} /></span>
                <span className="crece">{n.asunto} · <span className="muted">{n.canal.toLowerCase()} a {n.destino}</span></span>
                <span className={`badge badge-${n.estado === 'ENVIADA' ? 'ok' : n.estado === 'FALLIDA' ? 'danger' : 'muted'}`}><i />{n.estado.toLowerCase()}</span>
                <small className="muted">{fechaHora(n.creadoEn)}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
