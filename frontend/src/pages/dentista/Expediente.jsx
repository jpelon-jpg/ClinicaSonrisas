import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import { fecha, fechaHora } from '../../utils/format'
import { Avatar, Badge, Cargando, ErrorEstado, Vacio, Spinner } from '../../components/Estados'
import Odontograma, { COLORES_PIEZA } from '../../components/Odontograma'
import Modal from '../../components/Modal'
import Field from '../../components/Field'

/**
 * Expediente clínico. Dentista: agrega notas y registros (no se editan ni borran, NOM-004).
 * ADMIN: solo lectura.  Paciente: usa la variante "propio" (solo lectura).
 */
export default function Expediente({ propio = false }) {
  const { pacienteId } = useParams()
  const [params] = useSearchParams()
  const { tieneRol } = useAuth()
  const puedeEditar = !propio && tieneRol('DENTISTA')
  const { datos, cargando, error, recargar } = useApi(() => api.get(propio ? '/paciente/expediente' : `/expedientes/${pacienteId}`), [pacienteId, propio])
  const [pieza, setPieza] = useState(null)
  const [modal, setModal] = useState(null)

  if (error) return <div className="pagina"><ErrorEstado error={error} onRetry={recargar} /></div>
  if (cargando && !datos) return <div className="pagina"><Cargando texto="Abriendo expediente…" /></div>
  const p = datos.paciente

  return (
    <div className="pagina">
      <header className="pagina-head">
        <div className="celda-persona">
          <Avatar nombre={p.nombreCompleto} url={p.avatarUrl} size={56} />
          <div><h1>{propio ? 'Mi expediente' : p.nombreCompleto}</h1>
            <p className="muted">{p.edad != null ? `${p.edad} años · ` : ''}{p.telefono || p.email}</p></div>
        </div>
        {!propio && <Link to={tieneRol('DENTISTA') ? '/dentista/pacientes' : '/recepcion/pacientes'} className="btn btn-ghost">‹ Volver</Link>}
      </header>

      <div className="grid-exp">
        <section className="card">
          <div className="card-head"><h2>Antecedentes</h2>{puedeEditar && <button className="btn btn-ghost sm" onClick={() => setModal('antecedentes')}>Editar</button>}</div>
          <dl className="datos">
            <dt>Alergias</dt><dd>{p.alergias ? <span className="chip chip-alerta">{p.alergias}</span> : 'Ninguna conocida'}</dd>
            <dt>Antecedentes</dt><dd>{p.antecedentes || 'Sin registrar'}</dd>
            <dt>Emergencia</dt><dd>{p.contactoEmergencia || '—'}</dd>
            <dt>Nacimiento</dt><dd>{p.fechaNacimiento ? fecha(p.fechaNacimiento + 'T12:00:00') : '—'}</dd>
          </dl>
        </section>

        <section className="card odonto-card">
          <div className="card-head"><h2>Odontograma</h2><span className="muted sm">Toca una pieza para ver su historial</span></div>
          <Odontograma registros={datos.odontograma} seleccionada={pieza} onSeleccionar={setPieza} />
          {pieza && <DetallePieza pacienteId={p.id} pieza={pieza} propio={propio} actual={datos.odontograma.find((r) => r.pieza === pieza)}
            puedeEditar={puedeEditar} onRegistrado={recargar} onCerrar={() => setPieza(null)} />}
        </section>

        <section className="card ancho-total">
          <div className="card-head"><h2>Notas de evolución</h2>{puedeEditar && <button className="btn btn-primary sm" onClick={() => setModal('nota')}>＋ Nueva nota</button>}</div>
          {datos.notas.length === 0 ? <Vacio texto="Sin notas registradas" /> : (
            <ol className="notas">
              {datos.notas.map((n) => (
                <li key={n.id} className="nota">
                  <header><strong>{fechaHora(n.creadoEn)}</strong><span className="muted">{n.dentista}</span></header>
                  <dl className="datos">
                    <dt>Motivo</dt><dd>{n.motivoConsulta}</dd>
                    <dt>Diagnóstico</dt><dd>{n.diagnostico}</dd>
                    <dt>Tratamiento</dt><dd>{n.tratamientoRealizado}</dd>
                    {n.pronostico && <><dt>Pronóstico</dt><dd>{n.pronostico}</dd></>}
                    {n.indicaciones && <><dt>Indicaciones</dt><dd>{n.indicaciones}</dd></>}
                  </dl>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card ancho-total">
          <h2>Últimas citas</h2>
          {datos.citas.length === 0 ? <Vacio texto="Sin citas" /> : (
            <ul className="lista">
              {datos.citas.map((c) => (
                <li key={c.id} className="lista-item"><div className="crece"><strong>{fechaHora(c.fechaHora)}</strong>
                  <small className="block muted">{c.tratamientos.map((t) => t.nombre).join(', ')} · {c.dentista.nombreCompleto}</small></div><Badge estado={c.estado} /></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {modal === 'antecedentes' && <AntecedentesModal p={p} onClose={() => setModal(null)} onGuardado={() => { setModal(null); recargar() }} />}
      {modal === 'nota' && <NotaModal pacienteId={p.id} citas={datos.citas} citaInicial={params.get('cita')} onClose={() => setModal(null)} onGuardado={() => { setModal(null); recargar() }} />}
    </div>
  )
}

function DetallePieza({ pacienteId, pieza, actual, puedeEditar, propio, onRegistrado, onCerrar }) {
  const toast = useToast()
  const [historial, setHistorial] = useState(null)
  const f = useForm({ estado: actual?.estado || 'SANA', observacion: '' }, { estado: [v.requerido()], observacion: [v.max(255)] })

  useEffect(() => {
    f.setValores({ estado: actual?.estado || 'SANA', observacion: '' })
    if (propio) { setHistorial(actual ? [actual] : []); return }
    setHistorial(null)
    api.get(`/expedientes/${pacienteId}/odontograma/${pieza}/historial`).then(setHistorial).catch(() => setHistorial([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieza, pacienteId])

  const guardar = f.enviar(async (d) => {
    try {
      await api.post(`/expedientes/${pacienteId}/odontograma`, { pieza, estado: d.estado, observacion: d.observacion || null })
      toast.ok(`Pieza ${pieza} registrada como ${COLORES_PIEZA[d.estado].texto.toLowerCase()}`)
      onRegistrado()
    } catch (e) { toast.error(e.message) }
  })

  return (
    <div className="detalle-pieza">
      <div className="card-head"><h3>Pieza {pieza}</h3><button className="icon-btn" onClick={onCerrar} aria-label="Cerrar detalle">×</button></div>
      {puedeEditar && (
        <form className="fila-form" onSubmit={guardar} noValidate>
          <Field as="select" label="Estado" {...f.campo('estado')}>
            {Object.entries(COLORES_PIEZA).map(([k, c]) => <option key={k} value={k}>{c.texto}</option>)}
          </Field>
          <Field label="Observación" className="crece" maxLength={255} {...f.campo('observacion')} />
          <button className="btn btn-primary" disabled={f.enviando}>{f.enviando && <Spinner sm />} Registrar</button>
        </form>
      )}
      {historial === null ? <Spinner sm /> : historial.length === 0 ? <p className="muted sm">Sin registros: pieza sana.</p> : (
        <ul className="historial">
          {historial.map((r) => <li key={r.id}><span className="punto" style={{ background: COLORES_PIEZA[r.estado].borde }} />
            <strong>{COLORES_PIEZA[r.estado].texto}</strong> <span className="muted">· {fechaHora(r.creadoEn)} · {r.dentista}</span>
            {r.observacion && <small className="block">{r.observacion}</small>}</li>)}
        </ul>
      )}
    </div>
  )
}

function AntecedentesModal({ p, onClose, onGuardado }) {
  const toast = useToast()
  const f = useForm({ alergias: p.alergias || '', antecedentes: p.antecedentes || '' }, { alergias: [v.max(255)], antecedentes: [v.max(2000)] })
  const submit = f.enviar(async (d) => {
    try { await api.put(`/expedientes/${p.id}/antecedentes`, d); toast.ok('Antecedentes actualizados'); onGuardado() } catch (e) { toast.error(e.message); throw e }
  })
  return (
    <Modal titulo="Antecedentes y alergias" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>Guardar</button></>}>
      <Field label="Alergias" {...f.campo('alergias')} />
      <Field as="textarea" rows={4} label="Antecedentes médicos" {...f.campo('antecedentes')} />
    </Modal>
  )
}

function NotaModal({ pacienteId, citas, citaInicial, onClose, onGuardado }) {
  const toast = useToast()
  const f = useForm({ citaId: citaInicial || '', motivoConsulta: '', diagnostico: '', tratamientoRealizado: '', pronostico: '', indicaciones: '' }, {
    motivoConsulta: [v.requerido('Describe el motivo de la consulta'), v.max(255)],
    diagnostico: [v.requerido('El diagnóstico es obligatorio (NOM-004)'), v.min(5), v.max(4000)],
    tratamientoRealizado: [v.requerido('Indica el tratamiento realizado'), v.min(5), v.max(4000)],
    pronostico: [v.max(255)], indicaciones: [v.max(4000)],
  })
  const submit = f.enviar(async (d) => {
    try {
      await api.post(`/expedientes/${pacienteId}/notas`, { ...d, citaId: d.citaId ? Number(d.citaId) : null })
      toast.ok('Nota de evolución agregada'); onGuardado()
    } catch (e) { toast.error(e.message); throw e }
  })
  return (
    <Modal titulo="Nueva nota de evolución" onClose={onClose} ancho={620}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>{f.enviando && <Spinner sm />} Guardar nota</button></>}>
      <p className="muted sm">Las notas no se pueden editar ni eliminar después de guardarlas.</p>
      <Field as="select" label="Cita relacionada (opcional)" {...f.campo('citaId')}>
        <option value="">Sin cita</option>
        {citas.filter((c) => c.estado === 'ATENDIDA' || c.estado === 'CONFIRMADA').map((c) => <option key={c.id} value={c.id}>{fechaHora(c.fechaHora)} · {c.tratamientos.map((t) => t.nombre).join(', ')}</option>)}
      </Field>
      <Field label="Motivo de consulta" {...f.campo('motivoConsulta')} />
      <Field as="textarea" rows={2} label="Diagnóstico" {...f.campo('diagnostico')} />
      <Field as="textarea" rows={2} label="Tratamiento realizado" {...f.campo('tratamientoRealizado')} />
      <div className="grid-2">
        <Field as="select" label="Pronóstico" {...f.campo('pronostico')}>
          <option value="">Sin especificar</option><option>Favorable</option><option>Reservado</option><option>Desfavorable</option>
        </Field>
      </div>
      <Field as="textarea" rows={2} label="Indicaciones al paciente" {...f.campo('indicaciones')} />
    </Modal>
  )
}
