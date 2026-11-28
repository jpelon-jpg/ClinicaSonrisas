import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { dinero, hora } from '../../utils/format'
import { Badge, Cargando, Encabezado, ErrorEstado, Vacio } from '../../components/Estados'
import Icono from '../../components/Icono'
import Paginacion from '../../components/Paginacion'
import ConfirmModal from '../../components/ConfirmModal'

const partes = (iso) => {
  const d = new Date(iso)
  return {
    dia: d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''),
    num: d.getDate(),
    mes: d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''),
    largo: d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', ''),
  }
}

export default function MisCitas() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tipo = params.get('tipo') === 'historial' ? 'historial' : 'proximas'
  const [page, setPage] = useState(0)
  const [cancelar, setCancelar] = useState(null)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/paciente/citas', { tipo, page, size: 6 }), [tipo, page])
  const { datos: resumen } = useApi(() => api.get('/paciente/resumen'), [datos])

  const cambiarTab = (t) => { setParams(t === 'historial' ? { tipo: t } : {}); setPage(0) }
  const cancelable = (c) => (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && new Date(c.fechaHora) > new Date(Date.now() + 24 * 3600000)

  return (
    <div className="pagina">
      <Encabezado titulo="Mis citas" subtitulo="Consulta y cancela tus citas.">
        <Link to="/paciente/agendar" className="btn btn-primary lg"><Icono nombre="calendarioMas" /> Agendar nueva cita</Link>
      </Encabezado>
      <div className="tabs-linea" role="tablist">
        <button role="tab" aria-selected={tipo === 'proximas'} className={tipo === 'proximas' ? 'activo' : ''} onClick={() => cambiarTab('proximas')}>
          Próximas{resumen ? ` (${resumen.citasProximas})` : ''}</button>
        <button role="tab" aria-selected={tipo === 'historial'} className={tipo === 'historial' ? 'activo' : ''} onClick={() => cambiarTab('historial')}>
          Anteriores{resumen ? ` (${resumen.citasAnteriores})` : ''}</button>
      </div>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> :
        datos.content.length === 0 ? <Vacio texto={tipo === 'proximas' ? 'No tienes citas próximas' : 'Aún no tienes historial'}>
          {tipo === 'proximas' && <Link to="/paciente/agendar" className="btn btn-primary">Agendar una cita</Link>}</Vacio> : (
          <>
            {datos.content.map((c) => {
              const p = partes(c.fechaHora)
              const activa = c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA'
              return (
                <article key={c.id} className="card cita-fila">
                  <div className={`fecha-tile ${activa ? '' : 'gris'}`} aria-label={p.largo}><small>{p.dia}</small><strong>{p.num}</strong><small>{p.mes}</small></div>
                  <div className="crece">
                    <h3>{c.tratamientos.map((t) => t.nombre).join(', ')}</h3>
                    <div className="cita-meta">
                      <span><Icono nombre="reloj" size={16} /> {hora(c.fechaHora)} h</span>
                      <span><Icono nombre="usuario" size={16} /> {c.dentista.nombreCompleto} · {c.dentista.consultorio}</span>
                      <span>{dinero(c.total)}</span>
                    </div>
                    {c.motivoRechazo && <p className="sm texto-peligro" style={{ marginTop: '.35rem' }}>Motivo: {c.motivoRechazo}</p>}
                  </div>
                  <Badge estado={c.estado} />
                  {cancelable(c) && <button className="btn btn-peligro-outline" onClick={() => setCancelar(c)}><Icono nombre="xCirculo" size={18} /> Cancelar</button>}
                </article>
              )
            })}
            <Paginacion pagina={datos} onCambiar={setPage} nombre="citas" />
          </>
        )}
      {tipo === 'proximas' && (
        <div className="card fila" style={{ gap: '1rem', marginTop: '.5rem' }}>
          <span className="tile sm tile-azul"><Icono nombre="info" size={18} /></span>
          <div><strong>Puedes cancelar sin costo hasta 24 horas antes de tu cita.</strong>
            <p className="muted sm">Después de ese plazo, comunícate con recepción.</p></div>
        </div>
      )}
      {cancelar && <ConfirmModal titulo="Cancelar cita" pedirMotivo textoConfirmar="Sí, cancelar"
        mensaje={`¿Seguro que quieres cancelar tu cita del ${partes(cancelar.fechaHora).largo} a las ${hora(cancelar.fechaHora)}?`}
        onConfirm={async (motivo) => {
          try { await api.patch(`/paciente/citas/${cancelar.id}/cancelar`, { motivo }); toast.ok('Tu cita fue cancelada'); recargar() } catch (e) { toast.error(e.message); throw e }
        }} onClose={() => setCancelar(null)} />}
    </div>
  )
}
