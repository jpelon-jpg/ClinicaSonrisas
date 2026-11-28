import { useState } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { fechaHora } from '../../utils/format'
import Tabla from '../../components/Tabla'
import Icono from '../../components/Icono'
import { Encabezado } from '../../components/Estados'
import { Seleccion } from '../../components/Filtros'

const CLASE = { ENVIADA: 'ok', FALLIDA: 'danger', OMITIDA: 'muted' }

/** Bitácora de correos, SMS y WhatsApp enviados por el sistema. */
export default function Notificaciones() {
  const [canal, setCanal] = useState('')
  const [estado, setEstado] = useState('')
  const [page, setPage] = useState(0)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/notificaciones', { canal, estado, page, size: 15 }), [canal, estado, page])
  const ICONO = { EMAIL: 'correo', SMS: 'telefono', WHATSAPP: 'enviar' }
  const columnas = [
    { titulo: 'Fecha', render: (n) => fechaHora(n.creadoEn) },
    { titulo: 'Canal', render: (n) => <span className="acceso"><span className="tile sm tile-menta"><Icono nombre={ICONO[n.canal]} size={16} /></span> {n.canal === 'EMAIL' ? 'Correo' : n.canal === 'SMS' ? 'SMS' : 'WhatsApp'}</span> },
    { titulo: 'Destino', render: (n) => n.destino },
    { titulo: 'Asunto', render: (n) => <>{n.asunto}{n.citaId && <small className="block muted">Cita #{n.citaId}</small>}</> },
    { titulo: 'Estado', render: (n) => <><span className={`badge badge-${CLASE[n.estado]}`}><i />{n.estado.charAt(0) + n.estado.slice(1).toLowerCase()}</span>{n.error && <small className="block texto-peligro">{n.error}</small>}</> },
  ]
  return (
    <div className="pagina">
      <Encabezado titulo="Bitácora de notificaciones" subtitulo="Correos (Postfix), SMS y WhatsApp enviados a los pacientes.">
        <button className="btn btn-outline lg" onClick={recargar}><Icono nombre="reiniciar" size={18} /> Actualizar</button>
      </Encabezado>
      <section className="tabla-card">
        <div className="filtros">
          <Seleccion icono="enviar" etiqueta="Canal" value={canal} onChange={(e) => { setCanal(e.target.value); setPage(0) }}>
            <option value="">Todos los canales</option><option value="EMAIL">Correo</option><option value="SMS">SMS</option><option value="WHATSAPP">WhatsApp</option>
          </Seleccion>
          <Seleccion icono="check" etiqueta="Estado" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(0) }}>
            <option value="">Todos los estados</option><option value="ENVIADA">Enviada</option><option value="FALLIDA">Fallida</option><option value="OMITIDA">Omitida</option>
          </Seleccion>
        </div>
        <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} nombre="avisos" />
      </section>
    </div>
  )
}
