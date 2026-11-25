import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { fechaLarga, hora, hoyISO } from '../../utils/format'
import { Avatar, Badge, Cargando, ErrorEstado, Vacio } from '../../components/Estados'
import ConfirmModal from '../../components/ConfirmModal'

const mover = (iso, dias) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + dias); return d.toLocaleDateString('en-CA') }

export default function Agenda() {
  const toast = useToast()
  const [fecha, setFecha] = useState(hoyISO())
  const [modal, setModal] = useState(null)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dentista/agenda', { fecha }), [fecha])

  const cerrar = async (c, tipo) => {
    try {
      await api.patch(`/citas/${c.id}/${tipo}`)
      toast.ok(tipo === 'atender' ? 'Cita marcada como atendida. Registra la nota de evolución en el expediente.' : 'Inasistencia registrada')
      recargar()
    } catch (e) { toast.error(e.message); throw e }
  }

  return (
    <div className="pagina">
      <header className="pagina-head">
        <div><h1>Mi agenda</h1><p className="muted cap">{fechaLarga(fecha + 'T12:00:00')}</p></div>
        <div className="btn-grupo">
          <button className="btn btn-ghost" onClick={() => setFecha(mover(fecha, -1))} aria-label="Día anterior">‹</button>
          <button className="btn btn-outline" onClick={() => setFecha(hoyISO())}>Hoy</button>
          <button className="btn btn-ghost" onClick={() => setFecha(mover(fecha, 1))} aria-label="Día siguiente">›</button>
          <input className="input" type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} aria-label="Elegir fecha" />
        </div>
      </header>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> : (
        <>
          <div className="kpis">
            <div className="kpi"><span>Citas del día</span><strong>{datos.total}</strong></div>
            <div className="kpi"><span>Atendidas</span><strong>{datos.atendidas}</strong></div>
            <div className="kpi kpi-destacado"><span>Siguiente paciente</span>
              <strong className="sm">{datos.siguiente ? `${hora(datos.siguiente.fechaHora)} · ${datos.siguiente.paciente.nombreCompleto}` : 'Sin pendientes'}</strong></div>
          </div>
          {datos.citas.length === 0 ? <Vacio texto="No tienes citas este día" /> : (
            <ul className="timeline">
              {datos.citas.map((c) => {
                const puedeCerrar = c.estado === 'CONFIRMADA' && new Date(c.fechaHora) <= new Date(Date.now() + 30 * 60000)
                return (
                  <li key={c.id} className={`card cita-linea estado-${c.estado.toLowerCase()}`}>
                    <div className="hora-col"><strong>{hora(c.fechaHora)}</strong><small>{hora(c.fin)}</small></div>
                    <Avatar nombre={c.paciente.nombreCompleto} url={c.paciente.avatarUrl} />
                    <div className="crece">
                      <strong>{c.paciente.nombreCompleto}</strong>
                      <small className="block muted">{c.tratamientos.map((t) => t.nombre).join(', ')}{c.motivo ? ` · ${c.motivo}` : ''}</small>
                    </div>
                    <Badge estado={c.estado} />
                    <div className="btn-grupo">
                      <Link className="btn btn-outline sm" to={`/dentista/expediente/${c.paciente.id}?cita=${c.id}`}>Expediente</Link>
                      {puedeCerrar && <>
                        <button className="btn btn-primary sm" onClick={() => setModal({ c, tipo: 'atender' })}>Atendida</button>
                        <button className="btn btn-ghost sm" onClick={() => setModal({ c, tipo: 'no-asistio' })}>No asistió</button>
                      </>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
      {modal && <ConfirmModal titulo={modal.tipo === 'atender' ? 'Marcar como atendida' : 'Registrar inasistencia'} peligro={modal.tipo !== 'atender'}
        textoConfirmar={modal.tipo === 'atender' ? 'Atendida' : 'No asistió'}
        mensaje={`${modal.c.paciente.nombreCompleto} · ${hora(modal.c.fechaHora)}. Este cambio no se puede revertir.`}
        onConfirm={() => cerrar(modal.c, modal.tipo)} onClose={() => setModal(null)} />}
    </div>
  )
}
