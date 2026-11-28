import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import { fecha, fechaHora } from '../../utils/format'
import { Avatar, Badge, Cargando, Encabezado, ErrorEstado, Vacio, Spinner } from '../../components/Estados'
import Odontograma, { COLORES_PIEZA } from '../../components/Odontograma'
import Icono from '../../components/Icono'
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

  const volver = tieneRol('DENTISTA') ? ['/dentista', 'Mi agenda'] : ['/recepcion/pacientes', 'Pacientes']
  const notaDeCita = params.get('cita')

  return (
    <div className="pagina">
      {!propio && <p className="migas"><Link to={volver[0]}>{volver[1]}</Link> / <strong>Expediente de {p.nombreCompleto}</strong></p>}
      {propio && <Encabezado titulo="Mi historial" subtitulo="Tu odontograma, tus tratamientos y tus últimas citas. Solo tu dentista puede modificarlo." />}

      <section className="card exp-cab">
        <Avatar nombre={p.nombreCompleto} url={p.avatarUrl} size={64} />
        <div className="crece">
          <h1>{p.nombreCompleto}</h1>
          <p className="muted">Expediente #{p.id}{p.edad != null ? ` · ${p.edad} años` : ''}{p.telefono ? ` · ${p.telefono}` : ''}</p>
        </div>
        {p.alergias && <span className="badge badge-danger" style={{ fontSize: 13, padding: '.4rem .8rem' }}><Icono nombre="alerta" size={15} /> Alergia: {p.alergias}</span>}
        {notaDeCita && !propio && <span className="badge badge-ok" style={{ fontSize: 13, padding: '.4rem .8rem' }}><Icono nombre="actividad" size={15} /> Consulta de hoy</span>}
        {puedeEditar && <button className="btn btn-primary lg" onClick={() => setModal('nota')}><Icono nombre="mas" size={18} /> Nueva nota de evolución</button>}
      </section>

      <div className="grid-exp">
        <div>
          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-head"><div><h2>Odontograma</h2><p>{puedeEditar ? 'Toca una pieza para registrar su estado' : 'Toca una pieza para ver su historial'} · numeración FDI</p></div></div>
            <Odontograma registros={datos.odontograma} seleccionada={pieza} onSeleccionar={setPieza} />
            {pieza && <DetallePieza pacienteId={p.id} pieza={pieza} propio={propio} actual={datos.odontograma.find((r) => r.pieza === pieza)}
              puedeEditar={puedeEditar} onRegistrado={recargar} onCerrar={() => setPieza(null)} />}
          </section>

          <section className="card">
            <div className="card-head"><div><h2>Historial de tratamientos</h2><p>Notas de evolución (NOM-004): no se editan ni se borran</p></div></div>
            {datos.notas.length === 0 ? <Vacio texto="Sin notas registradas" /> : (
              <ol className="notas tl-notas">
                {datos.notas.map((n) => (
                  <li key={n.id}>
                    <div className="fila-entre"><strong>{n.tratamientoRealizado}</strong><small>{fechaHora(n.creadoEn)}</small></div>
                    <small className="block">{n.dentista} · {n.diagnostico}</small>
                    {(n.pronostico || n.indicaciones) && <small className="block" style={{ marginTop: 2 }}>
                      {n.pronostico ? `Pronóstico ${n.pronostico.toLowerCase()}. ` : ''}{n.indicaciones || ''}</small>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div>
          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-head"><div><h2>Antecedentes</h2><p>Información médica relevante</p></div>
              {puedeEditar && <button className="btn btn-outline sm" onClick={() => setModal('antecedentes')}><Icono nombre="lapiz" size={16} /> Editar</button>}</div>
            <div className="dato-ico"><span className="tile sm tile-rojo"><Icono nombre="alerta" size={18} /></span>
              <div><small>Alergias</small><strong style={p.alergias ? { color: 'var(--danger)' } : undefined}>{p.alergias || 'Ninguna conocida'}</strong></div></div>
            <div className="dato-ico"><span className="tile sm tile-menta"><Icono nombre="archivo" size={18} /></span>
              <div><small>Antecedentes</small><strong>{p.antecedentes || 'Sin registrar'}</strong></div></div>
            <div className="dato-ico"><span className="tile sm tile-azul"><Icono nombre="telefono" size={18} /></span>
              <div><small>Contacto de emergencia</small><strong>{p.contactoEmergencia || '—'}</strong></div></div>
            <div className="dato-ico" style={{ marginBottom: 0 }}><span className="tile sm tile-gris"><Icono nombre="calendario" size={18} /></span>
              <div><small>Fecha de nacimiento</small><strong>{p.fechaNacimiento ? fecha(p.fechaNacimiento + 'T12:00:00') : '—'}</strong></div></div>
          </section>

          <section className="card">
            <div className="card-head"><div><h2>Últimas citas</h2></div></div>
            {datos.citas.length === 0 ? <Vacio texto="Sin citas" /> : (
              <ul className="lista">
                {datos.citas.map((c) => (
                  <li key={c.id} className="lista-item"><Icono nombre="diente" size={20} style={{ color: 'var(--main)' }} />
                    <div className="crece"><strong>{c.tratamientos.map((t) => t.nombre).join(', ')}</strong>
                      <small className="block muted">{fechaHora(c.fechaHora)} · {c.dentista.nombreCompleto}</small></div><Badge estado={c.estado} /></li>
                ))}
              </ul>
            )}
          </section>
        </div>
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
    <Modal titulo="Antecedentes y alergias" subtitulo="Se muestran en la cabecera del expediente." icono="alerta" tono="rojo" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>Guardar</button></>}>
      <Field label="Alergias" icono="alerta" {...f.campo('alergias')} />
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
    <Modal titulo="Nota de evolución" subtitulo="Solo el dentista puede escribir en el expediente clínico." icono="archivo" onClose={onClose} ancho={640}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>{f.enviando ? <Spinner sm /> : <Icono nombre="check" size={18} />} Guardar nota</button></>}>
      <p className="muted sm">Las notas no se pueden editar ni eliminar después de guardarlas.</p>
      <Field as="select" label="Cita relacionada (opcional)" icono="calendario" {...f.campo('citaId')}>
        <option value="">Sin cita</option>
        {citas.filter((c) => c.estado === 'ATENDIDA' || c.estado === 'CONFIRMADA').map((c) => <option key={c.id} value={c.id}>{fechaHora(c.fechaHora)} · {c.tratamientos.map((t) => t.nombre).join(', ')}</option>)}
      </Field>
      <Field label="Motivo de consulta" icono="archivo" {...f.campo('motivoConsulta')} />
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
