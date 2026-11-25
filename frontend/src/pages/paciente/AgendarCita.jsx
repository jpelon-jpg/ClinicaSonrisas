import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import { dinero, hoyISO } from '../../utils/format'
import { Avatar, Cargando, ErrorEstado } from '../../components/Estados'
import Field from '../../components/Field'
import HorarioPicker from '../recepcion/HorarioPicker'

/** El paciente solicita una cita en línea; queda PENDIENTE hasta que recepción la confirme. */
export default function AgendarCita() {
  const toast = useToast()
  const navigate = useNavigate()
  const [catalogos, setCatalogos] = useState(null)
  const [errorCarga, setErrorCarga] = useState(null)
  const [errorGeneral, setErrorGeneral] = useState(null)
  const f = useForm({ tratamientoIds: [], dentistaId: '', fecha: '', hora: '', motivo: '' }, {
    tratamientoIds: [(x) => (x.length ? null : 'Elige al menos un servicio')],
    dentistaId: [v.requerido('Elige con quién quieres tu cita')],
    fecha: [v.requerido('Elige un día'), (x) => (x && x < hoyISO() ? 'El día ya pasó' : null),
      (x) => (x && new Date(x + 'T12:00:00').getDay() === 0 ? 'Los domingos no abrimos' : null)],
    hora: [v.requerido('Elige un horario')],
    motivo: [v.max(255)],
  })

  const cargar = () => {
    setErrorCarga(null)
    Promise.all([api.get('/tratamientos/activos'), api.get('/dentistas')])
      .then(([t, d]) => setCatalogos({ tratamientos: t, dentistas: d.filter((x) => x.activo) }))
      .catch(setErrorCarga)
  }
  useEffect(cargar, [])

  if (errorCarga) return <div className="pagina"><ErrorEstado error={errorCarga} onRetry={cargar} /></div>
  if (!catalogos) return <div className="pagina"><Cargando /></div>

  const sel = catalogos.tratamientos.filter((t) => f.valores.tratamientoIds.includes(t.id))
  const toggle = (id) => {
    const s = f.valores.tratamientoIds
    f.cambiar('tratamientoIds', s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  const submit = f.enviar(async (d) => {
    setErrorGeneral(null)
    try {
      await api.post('/paciente/citas', { dentistaId: Number(d.dentistaId), fechaHora: `${d.fecha}T${d.hora}:00`, tratamientoIds: d.tratamientoIds, motivo: d.motivo || null })
      toast.ok('¡Solicitud enviada! Te avisaremos cuando recepción la confirme.')
      navigate('/paciente/citas')
    } catch (e) { setErrorGeneral(e.message) }
  })

  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>Agendar cita</h1><p className="muted">Tu solicitud quedará pendiente hasta que recepción la confirme</p></div></header>
      <form className="agendar" onSubmit={submit} noValidate>
        {errorGeneral && <div className="alerta alerta-error ancho-total" role="alert">{errorGeneral}</div>}
        <section className="card">
          <h2>1. ¿Qué necesitas?</h2>
          <div className="checks">
            {catalogos.tratamientos.map((t) => (
              <label key={t.id} className={`check ${f.valores.tratamientoIds.includes(t.id) ? 'sel' : ''}`}>
                <input type="checkbox" checked={f.valores.tratamientoIds.includes(t.id)} onChange={() => toggle(t.id)} />
                <span>{t.nombre}</span><small>{t.duracionMin} min · {dinero(t.precio)}</small>
              </label>
            ))}
          </div>
          {f.errores.tratamientoIds && <p className="field-msg">{f.errores.tratamientoIds}</p>}
        </section>
        <section className="card">
          <h2>2. Elige a tu dentista</h2>
          <div className="opciones-dentista" role="radiogroup">
            {catalogos.dentistas.map((d) => (
              <button type="button" role="radio" aria-checked={f.valores.dentistaId === String(d.id)} key={d.id}
                className={`opcion ${f.valores.dentistaId === String(d.id) ? 'sel' : ''}`}
                onClick={() => { f.cambiar('dentistaId', String(d.id)); f.cambiar('hora', '') }}>
                <Avatar nombre={d.nombreCompleto} url={d.avatarUrl} /><span><strong>{d.nombreCompleto}</strong><small className="block muted">{d.especialidad}</small></span>
              </button>
            ))}
          </div>
          {f.errores.dentistaId && <p className="field-msg">{f.errores.dentistaId}</p>}
        </section>
        <section className="card">
          <h2>3. Día y hora</h2>
          <Field label="Día" type="date" min={hoyISO()} {...f.campo('fecha')} onChange={(e) => { f.cambiar('fecha', e.target.value); f.cambiar('hora', '') }} />
          <HorarioPicker dentistaId={f.valores.dentistaId} fecha={f.errores.fecha ? '' : f.valores.fecha} value={f.valores.hora}
            onChange={(h) => f.cambiar('hora', h)} error={f.errores.hora} />
          <Field as="textarea" rows={2} label="¿Algo que debamos saber? (opcional)" maxLength={255} {...f.campo('motivo')} />
        </section>
        <aside className="card resumen">
          <h2>Resumen</h2>
          {sel.length ? sel.map((t) => <p key={t.id} className="fila-entre"><span>{t.nombre}</span><span>{dinero(t.precio)}</span></p>) : <p className="muted">Elige un servicio</p>}
          <p className="fila-entre total"><strong>Total estimado</strong><strong>{dinero(sel.reduce((a, t) => a + Number(t.precio), 0))}</strong></p>
          <button className="btn btn-primary btn-block" disabled={f.enviando}>{f.enviando && <span className="spinner sm" />} Solicitar cita</button>
        </aside>
      </form>
    </div>
  )
}
