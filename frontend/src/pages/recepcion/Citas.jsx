import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { dinero, fecha, hora, ESTADOS_CITA } from '../../utils/format'
import { Avatar, Badge, Encabezado } from '../../components/Estados'
import Icono from '../../components/Icono'
import Modal from '../../components/Modal'
import { Buscar, Seleccion } from '../../components/Filtros'
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
    { titulo: 'Paciente', render: (c) => <div className="celda-persona"><Avatar nombre={c.paciente.nombreCompleto} url={c.paciente.avatarUrl} size={36} />
      <div><strong>{c.paciente.nombreCompleto}</strong><small>Expediente #{c.paciente.id}</small></div></div> },
    { titulo: 'Dentista', render: (c) => c.dentista.nombreCompleto },
    { titulo: 'Fecha', render: (c) => new Date(c.fechaHora).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
    { titulo: 'Hora', render: (c) => <strong>{hora(c.fechaHora)}</strong> },
    { titulo: 'Tratamiento', render: (c) => <>{c.tratamientos.map((t) => t.nombre).join(', ')}<small className="block muted">{dinero(c.total)}</small></> },
    { titulo: 'Estado', render: (c) => <><Badge estado={c.estado} />{c.origen === 'EN_LINEA' && <small className="block muted" style={{ marginTop: 4 }}>En línea</small>}</> },
    {
      titulo: 'Acciones', className: 'acciones-td', render: (c) => {
        const activa = c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA'
        return (
          <div className="acciones">
            <button className="accion ver" title="Ver detalle" aria-label="Ver detalle" onClick={() => setModal({ tipo: 'ver', cita: c })}><Icono nombre="ojo" size={18} /></button>
            <button className="accion" title="Editar" aria-label="Editar" disabled={!activa} style={activa ? undefined : { opacity: .35, cursor: 'not-allowed' }}
              onClick={() => activa && setModal({ tipo: 'form', cita: c })}><Icono nombre="lapiz" size={18} /></button>
            <button className="accion borrar" title={activa ? 'Cancelar cita' : 'Eliminar'} aria-label={activa ? 'Cancelar cita' : 'Eliminar'}
              disabled={!activa && !(tieneRol('ADMIN') && c.estado !== 'ATENDIDA')}
              style={activa || (tieneRol('ADMIN') && c.estado !== 'ATENDIDA') ? undefined : { opacity: .35, cursor: 'not-allowed' }}
              onClick={() => setModal({ tipo: activa ? 'cancelar' : 'eliminar', cita: c })}><Icono nombre="basura" size={18} /></button>
          </div>
        )
      },
    },
  ]

  const m = modal
  return (
    <div className="pagina">
      <Encabezado titulo="Gestión de citas" subtitulo="Consulta y organiza las citas programadas de la clínica.">
        <button className="btn btn-primary lg" onClick={() => setModal({ tipo: 'form' })}><Icono nombre="mas" /> Nueva cita</button>
      </Encabezado>
      <section className="tabla-card">
        <div className="filtros">
          <Buscar placeholder="Buscar paciente o dentista" value={filtros.q} onChange={filtro('q')} />
          <Seleccion icono="check" etiqueta="Estado" value={filtros.estado} onChange={filtro('estado')}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS_CITA).map(([k, e]) => <option key={k} value={k}>{e.texto}</option>)}
          </Seleccion>
          <Seleccion icono="usuarios" etiqueta="Dentista" value={filtros.dentistaId} onChange={filtro('dentistaId')}>
            <option value="">Todos los dentistas</option>
            {dentistas?.map((d) => <option key={d.id} value={d.id}>{d.nombreCompleto}</option>)}
          </Seleccion>
          <Seleccion icono="enviar" etiqueta="Origen" value={filtros.origen} onChange={filtro('origen')}>
            <option value="">Cualquier origen</option><option value="RECEPCION">Recepción</option><option value="EN_LINEA">En línea</option>
          </Seleccion>
          <label className="filtro-fecha">Desde<input className="input" type="date" value={filtros.desde} onChange={filtro('desde')} /></label>
          <label className="filtro-fecha">Hasta<input className="input" type="date" value={filtros.hasta} onChange={filtro('hasta')} /></label>
          <button className="btn btn-texto" onClick={limpiar}><Icono nombre="reiniciar" size={18} /> Limpiar filtros</button>
        </div>
        <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} nombre="citas" />
      </section>

      {m?.tipo === 'ver' && (
        <Modal titulo="Detalle de la cita" subtitulo={`${fecha(m.cita.fechaHora)} · ${hora(m.cita.fechaHora)}–${hora(m.cita.fin)}`} icono="calendario" onClose={() => setModal(null)}
          footer={<>
            {tieneRol('ADMIN') && m.cita.estado !== 'ATENDIDA' && <button className="btn btn-peligro-outline" onClick={() => setModal({ tipo: 'eliminar', cita: m.cita })}><Icono nombre="basura" size={18} /> Eliminar</button>}
            <span className="crece" />
            {m.cita.estado === 'CONFIRMADA' && <button className="btn btn-outline" onClick={() => { recordatorio(m.cita); setModal(null) }}><Icono nombre="campana" size={18} /> Enviar recordatorio</button>}
            {m.cita.estado === 'CONFIRMADA' && new Date(m.cita.fechaHora) <= new Date(Date.now() + 30 * 60000) && <>
              <button className="btn btn-outline" onClick={() => setModal({ tipo: 'noasistio', cita: m.cita })}>No asistió</button>
              <button className="btn btn-primary" onClick={() => setModal({ tipo: 'atender', cita: m.cita })}><Icono nombre="check" size={18} /> Atendida</button>
            </>}
          </>}>
          <div className="celda-persona" style={{ marginBottom: '1.25rem' }}>
            <Avatar nombre={m.cita.paciente.nombreCompleto} url={m.cita.paciente.avatarUrl} size={48} />
            <div><strong>{m.cita.paciente.nombreCompleto}</strong><small>{m.cita.paciente.email}{m.cita.paciente.telefono ? ` · ${m.cita.paciente.telefono}` : ''}</small></div>
            <span className="crece" /><Badge estado={m.cita.estado} />
          </div>
          <dl className="datos">
            <dt>Dentista</dt><dd>{m.cita.dentista.nombreCompleto} · {m.cita.dentista.consultorio}</dd>
            <dt>Tratamiento</dt><dd>{m.cita.tratamientos.map((t) => t.nombre).join(', ')} · {dinero(m.cita.total)}</dd>
            <dt>Origen</dt><dd>{m.cita.origen === 'EN_LINEA' ? 'Solicitada en línea por el paciente' : 'Registrada en recepción'}</dd>
            {m.cita.motivo && <><dt>Notas</dt><dd>{m.cita.motivo}</dd></>}
            {m.cita.motivoRechazo && <><dt>Motivo</dt><dd>{m.cita.motivoRechazo}</dd></>}
          </dl>
        </Modal>
      )}
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
