import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { dinero, fecha, hora, ESTADOS_CITA } from '../../utils/format'
import { Badge } from '../../components/Estados'
import Tabla from '../../components/Tabla'
import ConfirmModal from '../../components/ConfirmModal'
import CitaFormModal from './CitaFormModal'

/** Listado de citas con filtros y paginación resueltos en el servidor. */
export default function Citas() {
  const { tieneRol } = useAuth()
  const toast = useToast()
  const [filtros, setFiltros] = useState({ q: '', estado: '', dentistaId: '', origen: '', desde: '', hasta: '' })
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null) // {tipo:'form'|'cancelar'|'eliminar'|'atender'|'noasistio', cita}
  const q = useDebounce(filtros.q)
  const { datos: dentistas } = useApi(() => api.get('/dentistas'))
  const { datos, cargando, error, recargar } = useApi(
    () => api.get('/citas', { ...filtros, q, page, size: 10, sort: 'fechaHora,desc' }),
    [q, filtros.estado, filtros.dentistaId, filtros.origen, filtros.desde, filtros.hasta, page])

  const filtro = (k) => (e) => { setFiltros((f) => ({ ...f, [k]: e.target.value })); setPage(0) }
  const limpiar = () => { setFiltros({ q: '', estado: '', dentistaId: '', origen: '', desde: '', hasta: '' }); setPage(0) }

  const accion = async (fn, ok) => {
    try { await fn(); toast.ok(ok); recargar() } catch (e) { toast.error(e.message); throw e }
  }

  const recordatorio = (c) => accion(() => api.post(`/citas/${c.id}/recordatorio`), 'Recordatorio enviado por correo, SMS y WhatsApp').catch(() => {})

  const columnas = [
    { titulo: 'Fecha', render: (c) => <><strong>{fecha(c.fechaHora)}</strong><small className="block muted">{hora(c.fechaHora)}–{hora(c.fin)}</small></> },
    { titulo: 'Paciente', render: (c) => <><strong>{c.paciente.nombreCompleto}</strong><small className="block muted">{c.paciente.telefono || c.paciente.email}</small></> },
    { titulo: 'Dentista', render: (c) => c.dentista.nombreCompleto },
    { titulo: 'Tratamientos', render: (c) => <>{c.tratamientos.map((t) => t.nombre).join(', ')}<small className="block muted">{dinero(c.total)}</small></> },
    { titulo: 'Origen', render: (c) => <span className="chip">{c.origen === 'EN_LINEA' ? 'En línea' : 'Recepción'}</span> },
    { titulo: 'Estado', render: (c) => <Badge estado={c.estado} /> },
    {
      titulo: 'Acciones', className: 'acciones', render: (c) => {
        const activa = c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA'
        return (
          <div className="btn-grupo">
            {activa && <button className="btn btn-ghost sm" onClick={() => setModal({ tipo: 'form', cita: c })}>Editar</button>}
            {c.estado === 'CONFIRMADA' && <button className="btn btn-ghost sm" onClick={() => recordatorio(c)}>Recordar</button>}
            {c.estado === 'CONFIRMADA' && new Date(c.fechaHora) <= new Date(Date.now() + 30 * 60000) && <>
              <button className="btn btn-ghost sm" onClick={() => setModal({ tipo: 'atender', cita: c })}>Atendida</button>
              <button className="btn btn-ghost sm" onClick={() => setModal({ tipo: 'noasistio', cita: c })}>No asistió</button>
            </>}
            {activa && <button className="btn btn-ghost sm texto-peligro" onClick={() => setModal({ tipo: 'cancelar', cita: c })}>Cancelar</button>}
            {tieneRol('ADMIN') && c.estado !== 'ATENDIDA' && <button className="btn btn-ghost sm texto-peligro" onClick={() => setModal({ tipo: 'eliminar', cita: c })}>Eliminar</button>}
          </div>
        )
      },
    },
  ]

  const m = modal
  return (
    <div className="pagina">
      <header className="pagina-head">
        <div><h1>Citas</h1><p className="muted">Agenda general de la clínica</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ tipo: 'form' })}>＋ Nueva cita</button>
      </header>
      <section className="filtros card">
        <input className="input" placeholder="Buscar paciente o dentista…" value={filtros.q} onChange={filtro('q')} aria-label="Buscar" />
        <select className="input" value={filtros.estado} onChange={filtro('estado')} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_CITA).map(([k, e]) => <option key={k} value={k}>{e.texto}</option>)}
        </select>
        <select className="input" value={filtros.dentistaId} onChange={filtro('dentistaId')} aria-label="Dentista">
          <option value="">Todos los dentistas</option>
          {dentistas?.map((d) => <option key={d.id} value={d.id}>{d.nombreCompleto}</option>)}
        </select>
        <select className="input" value={filtros.origen} onChange={filtro('origen')} aria-label="Origen">
          <option value="">Cualquier origen</option><option value="RECEPCION">Recepción</option><option value="EN_LINEA">En línea</option>
        </select>
        <label className="filtro-fecha">Desde<input className="input" type="date" value={filtros.desde} onChange={filtro('desde')} /></label>
        <label className="filtro-fecha">Hasta<input className="input" type="date" value={filtros.hasta} onChange={filtro('hasta')} /></label>
        <button className="btn btn-ghost" onClick={limpiar}>Limpiar</button>
      </section>
      <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} />

      {m?.tipo === 'form' && <CitaFormModal cita={m.cita} onClose={() => setModal(null)} onGuardada={() => { setModal(null); recargar() }} />}
      {m?.tipo === 'cancelar' && <ConfirmModal titulo="Cancelar cita" pedirMotivo textoConfirmar="Cancelar cita"
        mensaje={`Se cancelará la cita de ${m.cita.paciente.nombreCompleto} del ${fecha(m.cita.fechaHora)} a las ${hora(m.cita.fechaHora)}. El paciente recibirá un aviso por correo y SMS.`}
        onConfirm={(motivo) => accion(() => api.patch(`/citas/${m.cita.id}/cancelar`, { motivo }), 'Cita cancelada')} onClose={() => setModal(null)} />}
      {m?.tipo === 'eliminar' && <ConfirmModal titulo="Eliminar cita" textoConfirmar="Eliminar definitivamente"
        mensaje="Esta acción borra la cita del sistema y no se puede deshacer. Si solo quieres anularla, usa Cancelar."
        onConfirm={() => accion(() => api.del(`/citas/${m.cita.id}`), 'Cita eliminada')} onClose={() => setModal(null)} />}
      {m?.tipo === 'atender' && <ConfirmModal titulo="Marcar como atendida" peligro={false} textoConfirmar="Marcar atendida"
        mensaje={`¿${m.cita.paciente.nombreCompleto} ya fue atendido?`}
        onConfirm={() => accion(() => api.patch(`/citas/${m.cita.id}/atender`), 'Cita marcada como atendida')} onClose={() => setModal(null)} />}
      {m?.tipo === 'noasistio' && <ConfirmModal titulo="Marcar inasistencia" textoConfirmar="No asistió"
        mensaje={`Se registrará que ${m.cita.paciente.nombreCompleto} no se presentó a su cita.`}
        onConfirm={() => accion(() => api.patch(`/citas/${m.cita.id}/no-asistio`), 'Inasistencia registrada')} onClose={() => setModal(null)} />}
    </div>
  )
}
