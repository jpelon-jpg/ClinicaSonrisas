import { useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { dinero, fechaHora, fechaLarga, hora } from '../../utils/format'
import { Cargando, ErrorEstado, Vacio, Avatar } from '../../components/Estados'
import Paginacion from '../../components/Paginacion'
import ConfirmModal from '../../components/ConfirmModal'

/** Citas solicitadas en línea por pacientes que esperan confirmación de recepción. */
export default function Solicitudes() {
  const toast = useToast()
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [procesando, setProcesando] = useState(null)
  const { datos, cargando, error, recargar } = useApi(
    () => api.get('/citas', { estado: 'PENDIENTE', page, size: 8, sort: 'fechaHora,asc' }), [page])

  const confirmar = async (c) => {
    setProcesando(c.id)
    try {
      await api.patch(`/citas/${c.id}/confirmar`)
      toast.ok(`Cita confirmada. ${c.paciente.nombreCompleto} recibirá correo, SMS y WhatsApp.`)
      recargar()
    } catch (e) { toast.error(e.message) } finally { setProcesando(null) }
  }

  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>Solicitudes en línea</h1><p className="muted">Citas que los pacientes pidieron desde el portal</p></div></header>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> :
        datos.content.length === 0 ? <Vacio texto="No hay solicitudes pendientes 🎉" /> : (
          <div className="tarjetas">
            {datos.content.map((c) => (
              <article key={c.id} className="card solicitud">
                <header className="solicitud-head">
                  <Avatar nombre={c.paciente.nombreCompleto} url={c.paciente.avatarUrl} />
                  <div><strong>{c.paciente.nombreCompleto}</strong><small className="block muted">{c.paciente.email}</small></div>
                </header>
                <dl className="datos">
                  <dt>Fecha</dt><dd>{fechaLarga(c.fechaHora)} · {hora(c.fechaHora)}</dd>
                  <dt>Dentista</dt><dd>{c.dentista.nombreCompleto}</dd>
                  <dt>Tratamiento</dt><dd>{c.tratamientos.map((t) => t.nombre).join(', ')} · {dinero(c.total)}</dd>
                  {c.motivo && <><dt>Motivo</dt><dd>{c.motivo}</dd></>}
                  <dt>Solicitada</dt><dd className="muted">{fechaHora(c.creadoEn)}</dd>
                </dl>
                <footer className="btn-grupo">
                  <button className="btn btn-ghost texto-peligro" onClick={() => setModal(c)} disabled={procesando === c.id}>Rechazar</button>
                  <button className="btn btn-primary" onClick={() => confirmar(c)} disabled={procesando === c.id}>
                    {procesando === c.id && <span className="spinner sm" />} Confirmar</button>
                </footer>
              </article>
            ))}
          </div>
        )}
      <Paginacion pagina={datos} onCambiar={setPage} />
      {modal && <ConfirmModal titulo="Rechazar solicitud" pedirMotivo textoConfirmar="Rechazar"
        mensaje={`Se rechazará la solicitud de ${modal.paciente.nombreCompleto}. Le enviaremos el motivo por correo.`}
        onConfirm={async (motivo) => {
          try { await api.patch(`/citas/${modal.id}/rechazar`, { motivo }); toast.ok('Solicitud rechazada'); recargar() } catch (e) { toast.error(e.message); throw e }
        }} onClose={() => setModal(null)} />}
    </div>
  )
}
