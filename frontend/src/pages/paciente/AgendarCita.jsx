import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import { dinero, hoyISO } from '../../utils/format'
import { Avatar, Cargando, Encabezado, ErrorEstado, Spinner } from '../../components/Estados'
import Field from '../../components/Field'
import Icono from '../../components/Icono'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const iso = (d) => d.toLocaleDateString('en-CA')
const largo = (f) => {
  const s = new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

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
    fecha: [v.requerido('Elige un día en el calendario'), (x) => (x && x < hoyISO() ? 'El día ya pasó' : null),
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

  const val = f.valores
  const sel = catalogos.tratamientos.filter((t) => val.tratamientoIds.includes(t.id))
  const dentista = catalogos.dentistas.find((d) => String(d.id) === val.dentistaId)
  const duracion = sel.reduce((a, t) => a + t.duracionMin, 0)
  const toggle = (id) => {
    const s = val.tratamientoIds
    f.cambiar('tratamientoIds', s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }
  const hechos = [sel.length > 0, Boolean(dentista), Boolean(val.fecha && val.hora)]
  const paso = hechos.indexOf(false) === -1 ? 3 : hechos.indexOf(false)

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
      <Encabezado titulo="Agendar una cita" subtitulo="Elige el servicio, tu dentista, el día y la hora que mejor te acomoden." />

      <section className="card pasos" aria-label="Progreso">
        {['Tratamiento', 'Dentista', 'Fecha y hora', 'Confirmar'].map((t, i) => (
          <PasoItem key={t} n={i + 1} texto={t} estado={i < paso ? 'hecho' : i === paso ? 'actual' : ''} ultimo={i === 3} lineaHecha={i < paso} />
        ))}
      </section>

      <form onSubmit={submit} noValidate>
        {errorGeneral && <div className="alerta alerta-error" role="alert"><Icono nombre="alerta" size={18} />{errorGeneral}</div>}
        <div className="agendar-2">
          <section className="card">
            <div className="card-head"><div><h2>1. ¿Qué necesitas?</h2><p>Puedes elegir más de un servicio</p></div></div>
            <div className="checks">
              {catalogos.tratamientos.map((t) => (
                <label key={t.id} className={`check ${val.tratamientoIds.includes(t.id) ? 'sel' : ''}`}>
                  <input type="checkbox" checked={val.tratamientoIds.includes(t.id)} onChange={() => toggle(t.id)} />
                  <span>{t.nombre}</span><small>{t.duracionMin} min · {dinero(t.precio)}</small>
                </label>
              ))}
            </div>
            {f.errores.tratamientoIds && <p className="field-msg" style={{ marginTop: '.5rem' }}>{f.errores.tratamientoIds}</p>}
          </section>
          <section className="card">
            <div className="card-head"><div><h2>2. Elige a tu dentista</h2><p>Cada dentista tiene su propio horario</p></div></div>
            <div className="opciones-dentista" role="radiogroup">
              {catalogos.dentistas.map((d) => (
                <button type="button" role="radio" aria-checked={val.dentistaId === String(d.id)} key={d.id}
                  className={`opcion ${val.dentistaId === String(d.id) ? 'sel' : ''}`}
                  onClick={() => { f.cambiar('dentistaId', String(d.id)); f.cambiar('hora', '') }}>
                  <Avatar nombre={d.nombreCompleto} url={d.avatarUrl} size={40} />
                  <span className="crece"><strong>{d.nombreCompleto}</strong><small className="block muted">{d.especialidad} · {d.consultorio}</small></span>
                  {val.dentistaId === String(d.id) && <Icono nombre="check" size={18} style={{ color: 'var(--main)' }} />}
                </button>
              ))}
            </div>
            {f.errores.dentistaId && <p className="field-msg" style={{ marginTop: '.5rem' }}>{f.errores.dentistaId}</p>}
          </section>
        </div>

        <div className="agendar">
          <section className="card">
            <Calendario valor={val.fecha} onElegir={(d) => { f.cambiar('fecha', d); f.cambiar('hora', '') }} />
            {f.errores.fecha && <p className="field-msg" style={{ marginTop: '.5rem' }}>{f.errores.fecha}</p>}
          </section>

          <section className="card">
            <div className="card-head"><div><h2>Horarios disponibles</h2><p>{val.fecha ? largo(val.fecha) : 'Primero elige un día'}</p></div></div>
            <Horarios dentistaId={val.dentistaId} fecha={val.fecha} valor={val.hora} onElegir={(h) => f.cambiar('hora', h)} />
            {f.errores.hora && <p className="field-msg" style={{ marginTop: '.5rem' }}>{f.errores.hora}</p>}
            <div className="lateral-sep" style={{ background: 'var(--border)', margin: '1.25rem 0 1rem' }} />
            <p className="muted sm fila"><Icono nombre="info" size={16} /> Los horarios en gris ya están ocupados.</p>
            <Field as="textarea" rows={2} label="¿Algo que debamos saber? (opcional)" maxLength={255} {...f.campo('motivo')} className="" />
          </section>

          <aside className="card resumen">
            <h2 style={{ marginBottom: '1.25rem' }}>Resumen de tu cita</h2>
            <div className="dato-ico"><span className="tile sm tile-menta"><Icono nombre="diente" size={18} /></span>
              <div><small>Tratamiento</small><strong>{sel.length ? sel.map((t) => t.nombre).join(', ') : '—'}</strong></div></div>
            <div className="dato-ico"><span className="tile sm tile-menta"><Icono nombre="usuario" size={18} /></span>
              <div><small>Dentista</small><strong>{dentista ? dentista.nombreCompleto : '—'}</strong></div></div>
            <div className="dato-ico"><span className="tile sm tile-menta"><Icono nombre="calendario" size={18} /></span>
              <div><small>Fecha</small><strong>{val.fecha ? largo(val.fecha) : '—'}</strong></div></div>
            <div className="dato-ico"><span className="tile sm tile-menta"><Icono nombre="reloj" size={18} /></span>
              <div><small>Hora</small><strong>{val.hora ? `${val.hora} h · ${duracion || 30} min` : '—'}</strong></div></div>
            <p className="fila-entre" style={{ borderTop: '1px solid var(--border)', paddingTop: '.9rem', marginBottom: '1rem' }}>
              <strong>Total estimado</strong><strong>{dinero(sel.reduce((a, t) => a + Number(t.precio), 0))}</strong></p>
            <div className="alerta alerta-ambar"><Icono nombre="info" size={18} />
              <span><strong>Tu cita quedará Pendiente</strong>hasta que recepción la confirme.</span></div>
            <button className="btn btn-primary btn-block" disabled={f.enviando}>
              {f.enviando ? <span className="spinner sm" /> : <Icono nombre="check" size={18} />} Confirmar cita</button>
            <button type="button" className="btn btn-outline btn-block" style={{ marginTop: '.75rem' }} onClick={() => navigate('/paciente')}>
              <Icono nombre="izquierda" size={18} /> Regresar</button>
          </aside>
        </div>
      </form>
    </div>
  )
}

function PasoItem({ n, texto, estado, ultimo, lineaHecha }) {
  return (
    <>
      <span className={`paso ${estado}`}>
        <span className="paso-num">{estado === 'hecho' ? <Icono nombre="check" size={16} stroke={2.5} /> : n}</span>
        <span className="paso-txt">{texto}</span>
      </span>
      {!ultimo && <span className={`paso-linea ${lineaHecha ? 'hecha' : ''}`} />}
    </>
  )
}

/** Calendario mensual: deshabilita días pasados y domingos. */
function Calendario({ valor, onElegir }) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const [mes, setMes] = useState(() => { const d = valor ? new Date(valor + 'T12:00:00') : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const inicio = (mes.getDay() + 6) % 7 // lunes = 0
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const celdas = [...Array(inicio).fill(null), ...Array.from({ length: dias }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))]
  const esMesActual = mes.getFullYear() === hoy.getFullYear() && mes.getMonth() === hoy.getMonth()
  return (
    <>
      <div className="calendario-cab">
        <h2>{MESES[mes.getMonth()].replace(/^./, (x) => x.toUpperCase())} {mes.getFullYear()}</h2>
        <div className="btn-grupo">
          <button type="button" className="accion" disabled={esMesActual} style={esMesActual ? { opacity: .4 } : undefined}
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label="Mes anterior"><Icono nombre="izquierda" size={18} /></button>
          <button type="button" className="accion" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Mes siguiente"><Icono nombre="derecha" size={18} /></button>
        </div>
      </div>
      <div className="calendario">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => <span key={d} className="dia-sem">{d}</span>)}
        {celdas.map((d, i) => d === null ? <span key={`v${i}`} /> : (
          <button type="button" key={iso(d)} className={`dia ${iso(d) === valor ? 'sel' : ''} ${d.getTime() === hoy.getTime() ? 'hoy' : ''}`}
            disabled={d < hoy || d.getDay() === 0} onClick={() => onElegir(iso(d))} aria-pressed={iso(d) === valor}>{d.getDate()}</button>
        ))}
      </div>
      <div className="leyenda-cal"><span>Días con atención</span><em className="muted" style={{ marginLeft: 'auto', fontStyle: 'normal' }}>Domingos cerrado</em></div>
    </>
  )
}

/** Horarios libres y ocupados del dentista ese día (consulta al servidor). */
function Horarios({ dentistaId, fecha, valor, onElegir }) {
  const [disp, setDisp] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [falla, setFalla] = useState(null)
  useEffect(() => {
    if (!dentistaId || !fecha) { setDisp(null); return }
    setCargando(true); setFalla(null)
    api.get(`/dentistas/${dentistaId}/disponibilidad`, { fecha })
      .then(setDisp).catch((e) => setFalla(e.message)).finally(() => setCargando(false))
  }, [dentistaId, fecha])

  if (!dentistaId || !fecha) return <p className="muted">Elige dentista y día para ver los horarios.</p>
  if (falla) return <p className="field-msg">{falla}</p>
  if (cargando || !disp) return <p className="muted fila"><Spinner sm /> Buscando horarios…</p>
  const todos = [...disp.horariosLibres.map((h) => [h, true]), ...disp.horariosOcupados.map((h) => [h, false])].sort((a, b) => a[0].localeCompare(b[0]))
  if (!disp.horariosLibres.length) return <p className="field-msg">No hay horarios libres ese día. Prueba otro día.</p>
  return (
    <div className="horarios" role="radiogroup" aria-label="Horarios disponibles">
      {todos.map(([h, libre]) => (
        <button type="button" key={h} role="radio" aria-checked={valor === h} disabled={!libre}
          className={`horario ${valor === h ? 'sel' : ''} ${libre ? '' : 'ocupado'}`} onClick={() => onElegir(h)}>{h}</button>
      ))}
    </div>
  )
}
