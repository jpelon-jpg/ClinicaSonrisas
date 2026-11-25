import { useState } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { fechaHora } from '../../utils/format'
import Tabla from '../../components/Tabla'

const CLASE = { ENVIADA: 'ok', FALLIDA: 'danger', OMITIDA: 'muted' }

/** Bitácora de correos, SMS y WhatsApp enviados por el sistema. */
export default function Notificaciones() {
  const [canal, setCanal] = useState('')
  const [estado, setEstado] = useState('')
  const [page, setPage] = useState(0)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/notificaciones', { canal, estado, page, size: 15 }), [canal, estado, page])
  const columnas = [
    { titulo: 'Fecha', render: (n) => fechaHora(n.creadoEn) },
    { titulo: 'Canal', render: (n) => <span className="chip">{n.canal}</span> },
    { titulo: 'Destino', render: (n) => n.destino },
    { titulo: 'Asunto', render: (n) => <>{n.asunto}{n.citaId && <small className="block muted">Cita #{n.citaId}</small>}</> },
    { titulo: 'Estado', render: (n) => <><span className={`badge badge-${CLASE[n.estado]}`}>{n.estado}</span>{n.error && <small className="block texto-peligro">{n.error}</small>}</> },
  ]
  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>Notificaciones</h1><p className="muted">Correo (Postfix), SMS y WhatsApp (Twilio)</p></div>
        <button className="btn btn-outline" onClick={recargar}>Actualizar</button></header>
      <section className="filtros card">
        <select className="input" value={canal} onChange={(e) => { setCanal(e.target.value); setPage(0) }} aria-label="Canal">
          <option value="">Todos los canales</option><option value="EMAIL">Correo</option><option value="SMS">SMS</option><option value="WHATSAPP">WhatsApp</option>
        </select>
        <select className="input" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(0) }} aria-label="Estado">
          <option value="">Todos los estados</option><option value="ENVIADA">Enviada</option><option value="FALLIDA">Fallida</option><option value="OMITIDA">Omitida</option>
        </select>
      </section>
      <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} />
    </div>
  )
}
