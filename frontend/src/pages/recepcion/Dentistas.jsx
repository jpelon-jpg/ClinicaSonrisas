import { useState } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { hoyISO } from '../../utils/format'
import { Avatar, Cargando, Encabezado, ErrorEstado, Spinner } from '../../components/Estados'
import Icono from '../../components/Icono'
import CitaFormModal from './CitaFormModal'

const fechaLargaDe = (iso) => {
  const s = new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Directorio de dentistas con su disponibilidad del día seleccionado. */
export default function Dentistas() {
  const [fecha, setFecha] = useState(hoyISO())
  const [agendar, setAgendar] = useState(null)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dentistas'))

  return (
    <div className="pagina">
      <Encabezado titulo="Dentistas" subtitulo={`Disponibilidad · ${fechaLargaDe(fecha)}`}>
        <div className="control con-icono"><Icono nombre="calendario" size={18} className="control-ico" />
          <input className="input" type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} aria-label="Día" /></div>
      </Encabezado>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando ? <Cargando /> : (
        <div className="tarjetas">
          {datos.map((d) => <TarjetaDentista key={d.id} d={d} fecha={fecha} onAgendar={() => setAgendar(d)} />)}
        </div>
      )}
      <p className="muted sm fila"><Icono nombre="info" size={16} /> Solo el administrador puede modificar los horarios de los dentistas.</p>
      {agendar && <CitaFormModal dentistaInicial={agendar.id} onClose={() => setAgendar(null)} onGuardada={() => setAgendar(null)} />}
    </div>
  )
}

function TarjetaDentista({ d, fecha, onAgendar }) {
  const { datos, cargando, error } = useApi(() => api.get(`/dentistas/${d.id}/disponibilidad`, { fecha }), [d.id, fecha])
  const ini = parseInt(d.horaInicio.slice(0, 2), 10)
  const fin = parseInt(d.horaFin.slice(0, 2), 10)
  const horas = []
  for (let h = ini; h < fin; h++) horas.push(h)
  const ocupadaHora = (h) => datos?.horariosOcupados.some((x) => parseInt(x.slice(0, 2), 10) === h)
  const corto = d.nombreCompleto.split(' ').slice(0, 2).join(' ')

  return (
    <article className={`card dentista-card ${d.activo ? '' : 'dentista inactivo'}`}>
      <div className="dentista-banda" />
      <div className="dentista-cuerpo">
        <div className="dentista-top">
          <Avatar nombre={d.nombreCompleto} url={d.avatarUrl} size={88} />
          {!d.activo ? <span className="badge badge-muted">Inactivo</span>
            : datos && datos.horariosLibres.length > 0 ? <span className="badge badge-ok"><Icono nombre="check" size={14} /> Disponible</span>
              : datos ? <span className="badge badge-warn">Agenda llena</span> : null}
        </div>
        <h3>{d.nombreCompleto}</h3>
        <p className="muted">{d.especialidad} · {d.consultorio}</p>
        <div className="lateral-sep" style={{ background: 'var(--border)', margin: '1.25rem 0' }} />
        {cargando ? <p className="muted fila"><Spinner sm /> Consultando agenda…</p> : error ? <p className="field-msg">{error.message}</p> : (
          <>
            <div className="fila-entre"><strong>Agenda del día</strong><span className="link sm">{datos.horariosOcupados.length} bloques ocupados</span></div>
            <div className="bloques">{horas.map((h) => <span key={h} className={`bloque ${ocupadaHora(h) ? 'ocupado' : ''}`} title={`${h}:00`} />)}</div>
            <div className="bloques-horas">{horas.map((h) => <span key={h}>{h}</span>)}</div>
            <div className="leyenda-bloques"><span>Ocupado</span><span className="libre">Libre</span></div>
            <strong>Próximos horarios libres</strong>
            <div className="libres">
              {datos.horariosLibres.length === 0 ? <span className="muted" style={{ border: 0, fontWeight: 400 }}>Sin horarios libres este día</span>
                : datos.horariosLibres.slice(0, 4).map((h) => <span key={h}>{h}</span>)}
            </div>
            {d.activo && <button className="btn btn-primary btn-block" onClick={onAgendar}><Icono nombre="calendarioMas" size={18} /> Agendar cita con {corto}</button>}
          </>
        )}
        <div className="dentista-pie">
          <span><Icono nombre="archivo" size={16} /> Cédula {d.cedulaProfesional}</span>
          <span><Icono nombre="reloj" size={16} /> Lun a sáb {d.horaInicio.slice(0, 5)} – {d.horaFin.slice(0, 5)}</span>
        </div>
      </div>
    </article>
  )
}
