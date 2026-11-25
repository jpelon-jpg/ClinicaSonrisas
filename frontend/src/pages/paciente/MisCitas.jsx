import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { dinero, fechaLarga, hora } from '../../utils/format'
import { Badge, Cargando, ErrorEstado, Vacio } from '../../components/Estados'
import Paginacion from '../../components/Paginacion'
import ConfirmModal from '../../components/ConfirmModal'

export default function MisCitas() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tipo = params.get('tipo') === 'historial' ? 'historial' : 'proximas'
  const [page, setPage] = useState(0)
  const [cancelar, setCancelar] = useState(null)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/paciente/citas', { tipo, page, size: 6 }), [tipo, page])

  const cambiarTab = (t) => { setParams(t === 'historial' ? { tipo: t } : {}); setPage(0) }
  const cancelable = (c) => (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && new Date(c.fechaHora) > new Date(Date.now() + 24 * 3600000)

  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>Mis citas</h1></div></header>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tipo === 'proximas'} className={tipo === 'proximas' ? 'activo' : ''} onClick={() => cambiarTab('proximas')}>Próximas</button>
        <button role="tab" aria-selected={tipo === 'historial'} className={tipo === 'historial' ? 'activo' : ''} onClick={() => cambiarTab('historial')}>Historial</button>
      </div>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> :
        datos.content.length === 0 ? <Vacio texto={tipo === 'proximas' ? 'No tienes citas próximas' : 'Aún no tienes historial'} /> : (
          <div className="tarjetas">
            {datos.content.map((c) => (
              <article key={c.id} className="card cita-card">
                <header className="fila-entre"><strong className="cap">{fechaLarga(c.fechaHora)}</strong><Badge estado={c.estado} /></header>
                <p className="cita-hora">{hora(c.fechaHora)} – {hora(c.fin)}</p>
                <p><strong>{c.tratamientos.map((t) => t.nombre).join(', ')}</strong></p>
                <p className="muted">{c.dentista.nombreCompleto} · {c.dentista.consultorio} · {dinero(c.total)}</p>
                {c.motivoRechazo && <p className="sm texto-peligro">Motivo: {c.motivoRechazo}</p>}
                {cancelable(c) && <button className="btn btn-ghost texto-peligro" onClick={() => setCancelar(c)}>Cancelar cita</button>}
                {(c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && !cancelable(c) && tipo === 'proximas' &&
                  <p className="muted sm">Para cancelar con menos de 24 h llama a la clínica.</p>}
              </article>
            ))}
          </div>
        )}
      <Paginacion pagina={datos} onCambiar={setPage} />
      {cancelar && <ConfirmModal titulo="Cancelar cita" pedirMotivo textoConfirmar="Sí, cancelar"
        mensaje={`¿Seguro que quieres cancelar tu cita del ${fechaLarga(cancelar.fechaHora)} a las ${hora(cancelar.fechaHora)}?`}
        onConfirm={async (motivo) => {
          try { await api.patch(`/paciente/citas/${cancelar.id}/cancelar`, { motivo }); toast.ok('Tu cita fue cancelada'); recargar() } catch (e) { toast.error(e.message); throw e }
        }} onClose={() => setCancelar(null)} />}
    </div>
  )
}
