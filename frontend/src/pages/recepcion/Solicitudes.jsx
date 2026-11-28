import { useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { dinero, fechaHora, hora } from '../../utils/format'
import { Avatar, Encabezado } from '../../components/Estados'
import Icono from '../../components/Icono'
import { Buscar, Seleccion } from '../../components/Filtros'
import Tabla from '../../components/Tabla'
import ConfirmModal from '../../components/ConfirmModal'

const diaCorto = (iso) => {
  const s = new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const hace = (iso) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 60) return `Hace ${Math.max(min, 1)} min`
  if (min < 24 * 60) return `Hace ${Math.round(min / 60)} h`
  return min < 48 * 60 ? 'Ayer' : fechaHora(iso)
}

/** Citas solicitadas en línea por pacientes que esperan confirmación de recepción. */
export default function Solicitudes() {
  const toast = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [dentistaId, setDentistaId] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [procesando, setProcesando] = useState(null)
  const q = useDebounce(busqueda)
  const { datos: dentistas } = useApi(() => api.get('/dentistas'))
  const { datos, cargando, error, recargar } = useApi(
    () => api.get('/citas', { estado: 'PENDIENTE', q, dentistaId, page, size: 8, sort: 'fechaHora,asc' }), [q, dentistaId, page])

  const confirmar = async (c) => {
    setProcesando(c.id)
    try {
      await api.patch(`/citas/${c.id}/confirmar`)
      toast.ok(`Cita confirmada. ${c.paciente.nombreCompleto} recibirá correo, SMS y WhatsApp.`)
      recargar()
    } catch (e) { toast.error(e.message) } finally { setProcesando(null) }
  }

  const columnas = [
    { titulo: 'Paciente', render: (c) => <div className="celda-persona"><Avatar nombre={c.paciente.nombreCompleto} url={c.paciente.avatarUrl} size={36} />
      <div><strong>{c.paciente.nombreCompleto}</strong><small className="acceso"><Icono nombre="correo" size={14} /> {c.paciente.email}</small></div></div> },
    { titulo: 'Tratamiento', render: (c) => <>{c.tratamientos.map((t) => t.nombre).join(', ')}<small className="block muted">{dinero(c.total)}</small></> },
    { titulo: 'Dentista', render: (c) => c.dentista.nombreCompleto },
    { titulo: 'Fecha solicitada', render: (c) => <strong>{diaCorto(c.fechaHora)} · {hora(c.fechaHora)}</strong> },
    { titulo: 'Recibida', render: (c) => <span className="muted">{hace(c.creadoEn)}</span> },
    {
      titulo: 'Acciones', className: 'acciones-td', render: (c) => (
        <div className="acciones">
          <button className="btn btn-primary sm" onClick={() => confirmar(c)} disabled={procesando === c.id}>
            {procesando === c.id ? <span className="spinner sm" /> : <Icono nombre="check" size={18} />} Confirmar</button>
          <button className="btn btn-peligro-outline sm" onClick={() => setModal(c)} disabled={procesando === c.id}><Icono nombre="x" size={18} /> Rechazar</button>
        </div>
      ),
    },
  ]

  return (
    <div className="pagina">
      <Encabezado titulo="Solicitudes de cita" subtitulo="Citas que los pacientes agendaron en línea y esperan tu confirmación.">
        {datos && <span className="badge badge-warn" style={{ fontSize: 14, padding: '.5rem 1rem' }}><Icono nombre="reloj" size={16} /> {datos.totalElements} por confirmar</span>}
      </Encabezado>
      <section className="tabla-card">
        <div className="filtros">
          <Buscar placeholder="Buscar paciente" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} />
          <Seleccion icono="usuario" etiqueta="Dentista" value={dentistaId} onChange={(e) => { setDentistaId(e.target.value); setPage(0) }}>
            <option value="">Todos los dentistas</option>
            {dentistas?.map((d) => <option key={d.id} value={d.id}>{d.nombreCompleto}</option>)}
          </Seleccion>
        </div>
        <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage}
          nombre="solicitudes" vacio="No hay solicitudes pendientes 🎉" />
        <p className="tabla-nota"><Icono nombre="info" size={16} /> Al confirmar, la cita pasa a Confirmada y el paciente recibe correo, SMS y WhatsApp. Al rechazar, se le envía el motivo por correo.</p>
      </section>
      {modal && <ConfirmModal titulo="Rechazar solicitud" pedirMotivo textoConfirmar="Rechazar"
        mensaje={`Se rechazará la solicitud de ${modal.paciente.nombreCompleto}. Le enviaremos el motivo por correo.`}
        onConfirm={async (motivo) => {
          try { await api.patch(`/citas/${modal.id}/rechazar`, { motivo }); toast.ok('Solicitud rechazada'); recargar() } catch (e) { toast.error(e.message); throw e }
        }} onClose={() => setModal(null)} />}
    </div>
  )
}
