import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Spinner } from '../../components/Estados'

/** Muestra los horarios libres de un dentista para una fecha (consulta al servidor). */
export default function HorarioPicker({ dentistaId, fecha, value, onChange, error, horaActual }) {
  const [disp, setDisp] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [falla, setFalla] = useState(null)

  useEffect(() => {
    if (!dentistaId || !fecha) { setDisp(null); return }
    setCargando(true); setFalla(null)
    api.get(`/dentistas/${dentistaId}/disponibilidad`, { fecha })
      .then(setDisp).catch((e) => setFalla(e.message)).finally(() => setCargando(false))
  }, [dentistaId, fecha])

  if (!dentistaId || !fecha) return <p className="field-hint">Elige dentista y fecha para ver los horarios.</p>
  if (cargando) return <p className="field-hint"><Spinner sm /> Buscando horarios…</p>
  if (falla) return <p className="field-msg">{falla}</p>
  const libres = [...(disp?.horariosLibres || [])]
  if (horaActual && !libres.includes(horaActual)) libres.unshift(horaActual)

  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <span className="label">Horario</span>
      {libres.length === 0
        ? <p className="field-msg">No hay horarios libres ese día. Prueba otra fecha.</p>
        : <div className="horarios" role="radiogroup" aria-label="Horarios disponibles">
            {libres.map((h) => (
              <button type="button" key={h} role="radio" aria-checked={value === h}
                className={`horario ${value === h ? 'sel' : ''}`} onClick={() => onChange(h)}>{h}</button>
            ))}
          </div>}
      {error && <p className="field-msg">{error}</p>}
    </div>
  )
}
