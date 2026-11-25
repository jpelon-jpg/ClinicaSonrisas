import { useState } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { hoyISO } from '../../utils/format'
import { Avatar, Cargando, ErrorEstado, Spinner } from '../../components/Estados'

/** Directorio de dentistas con su disponibilidad del día seleccionado. */
export default function Dentistas() {
  const [fecha, setFecha] = useState(hoyISO())
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dentistas'))

  return (
    <div className="pagina">
      <header className="pagina-head">
        <div><h1>Dentistas</h1><p className="muted">Turnos y horarios libres</p></div>
        <label className="filtro-fecha">Día <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
      </header>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando ? <Cargando /> : (
        <div className="tarjetas">
          {datos.map((d) => <TarjetaDentista key={d.id} d={d} fecha={fecha} />)}
        </div>
      )}
    </div>
  )
}

function TarjetaDentista({ d, fecha }) {
  const { datos, cargando, error } = useApi(() => api.get(`/dentistas/${d.id}/disponibilidad`, { fecha }), [d.id, fecha])
  return (
    <article className={`card dentista ${d.activo ? '' : 'inactivo'}`}>
      <header className="solicitud-head">
        <Avatar nombre={d.nombreCompleto} url={d.avatarUrl} size={48} />
        <div><strong>{d.nombreCompleto}</strong><small className="block muted">{d.especialidad} · {d.consultorio}</small>
          <small className="block muted">Cédula {d.cedulaProfesional} · Turno {d.horaInicio.slice(0, 5)}–{d.horaFin.slice(0, 5)}</small></div>
      </header>
      {!d.activo ? <p className="muted">Inactivo</p> : cargando ? <p className="muted"><Spinner sm /> Consultando…</p> : error ? <p className="field-msg">{error.message}</p> : (
        <>
          <p className="sm"><strong>{datos.horariosLibres.length}</strong> horarios libres · <strong>{datos.horariosOcupados.length}</strong> ocupados</p>
          <div className="horarios mini">
            {[...datos.horariosLibres.map((h) => [h, 'libre']), ...datos.horariosOcupados.map((h) => [h, 'ocupado'])]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([h, t]) => <span key={h} className={`horario ${t}`}>{h}</span>)}
          </div>
        </>
      )}
    </article>
  )
}
