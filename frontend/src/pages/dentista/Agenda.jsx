import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { fechaLarga, hora, hoyISO } from '../../utils/format'
import { saludo } from '../../utils/saludo'
import { Avatar, Badge, Cargando, Encabezado, ErrorEstado, Kpi, Vacio } from '../../components/Estados'
import Icono from '../../components/Icono'
import ConfirmModal from '../../components/ConfirmModal'

const mover = (iso, dias) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + dias); return d.toLocaleDateString('en-CA') }
const ahoraEn = (c) => new Date(c.fechaHora) <= new Date() && new Date(c.fin) > new Date()

export default function Agenda() {
  const { usuario } = useAuth()
  const toast = useToast()
  const [fecha, setFecha] = useState(hoyISO())
  const [modal, setModal] = useState(null)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dentista/agenda', { fecha }), [fecha])
  const { datos: dentistas } = useApi(() => api.get('/dentistas'))
  const yo = dentistas?.find((d) => d.usuarioId === usuario.id)

  const cerrar = async (c, tipo) => {
    try {
      await api.patch(`/citas/${c.id}/${tipo}`)
      toast.ok(tipo === 'atender' ? 'Cita marcada como atendida. Registra la nota de evolución en el expediente.' : 'Inasistencia registrada')
      recargar()
    } catch (e) { toast.error(e.message); throw e }
  }
  const puedeCerrar = (c) => c.estado === 'CONFIRMADA' && new Date(c.fechaHora) <= new Date(Date.now() + 30 * 60000)
  const enConsulta = datos?.citas.find((c) => c.estado === 'CONFIRMADA' && ahoraEn(c))
  const foco = enConsulta || datos?.siguiente
  const esHoy = fecha === hoyISO()

  return (
    <div className="pagina">
      <Encabezado titulo={esHoy ? `${saludo()}, ${usuario.nombre}` : 'Mi agenda'}
        subtitulo={`${fechaLarga(fecha + 'T12:00:00').replace(/^./, (x) => x.toUpperCase())}${yo ? ` · ${yo.consultorio}` : ''}`}>
        <button className="btn btn-outline" onClick={() => setFecha(mover(fecha, -1))} aria-label="Día anterior"><Icono nombre="izquierda" size={18} /></button>
        <button className="btn btn-outline" onClick={() => setFecha(hoyISO())}>Hoy</button>
        <button className="btn btn-outline" onClick={() => setFecha(mover(fecha, 1))} aria-label="Día siguiente"><Icono nombre="derecha" size={18} /></button>
        <div className="control con-icono"><Icono nombre="calendario" size={18} className="control-ico" />
          <input className="input" type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} aria-label="Elegir fecha" /></div>
      </Encabezado>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> : (
        <>
          <div className="kpis">
            <Kpi icono={<Icono nombre="calendario" />} titulo={esHoy ? 'Citas de hoy' : 'Citas del día'} detalle="Agenda del día" valor={datos.total} />
            <Kpi icono={<Icono nombre="usuarioCheck" />} tono="azul" titulo="Atendidos" detalle={`De ${datos.total} pacientes`} valor={datos.atendidas} />
            <Kpi icono={<Icono nombre="reloj" />} tono="ambar" titulo="Siguiente cita"
              detalle={datos.siguiente ? `${datos.siguiente.paciente.nombreCompleto} · ${datos.siguiente.tratamientos[0]?.nombre || ''}` : 'Sin pendientes'}
              valor={datos.siguiente ? hora(datos.siguiente.fechaHora) : '—'} />
          </div>

          <div className="agenda-grid">
            <section className="card">
              <div className="card-head"><div><h2>Agenda del día</h2><p>Tus citas asignadas, en orden</p></div></div>
              {datos.citas.length === 0 ? <Vacio texto="No tienes citas este día" /> : (
                <ul className="timeline">
                  {datos.citas.map((c) => {
                    const actual = enConsulta?.id === c.id
                    const pasada = c.estado === 'ATENDIDA' || c.estado === 'NO_ASISTIO'
                    return (
                      <li key={c.id} className={`tl-item ${actual ? 'actual' : ''} ${pasada ? 'pasada' : ''}`}>
                        <span className="tl-hora">{hora(c.fechaHora)}</span>
                        <span className="tl-punto" />
                        <Avatar nombre={c.paciente.nombreCompleto} url={c.paciente.avatarUrl} size={36} />
                        <div><span className="tl-nombre">{c.paciente.nombreCompleto}</span>
                          <small>{c.tratamientos.map((t) => t.nombre).join(', ')}{c.motivo ? ` · ${c.motivo}` : ''}</small></div>
                        {actual ? <span className="badge badge-teal"><Icono nombre="actividad" size={14} /> En consulta</span> : <Badge estado={c.estado} />}
                        {actual
                          ? <Link className="btn btn-primary sm" to={`/dentista/expediente/${c.paciente.id}?cita=${c.id}`}><Icono nombre="portapapeles" size={16} /> Abrir expediente</Link>
                          : <Link className="link sm" to={`/dentista/expediente/${c.paciente.id}?cita=${c.id}`}>Ver expediente</Link>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="card">
              {!foco ? (
                <><h2>Paciente en consulta</h2><Vacio texto="No hay más pacientes por atender" /></>
              ) : (
                <>
                  <div className="card-head">
                    <h2>{enConsulta ? 'Paciente en consulta' : 'Siguiente paciente'}</h2>
                    <span className="hora-pill">{hora(foco.fechaHora)} h</span>
                  </div>
                  <div className="consulta-paciente">
                    <Avatar nombre={foco.paciente.nombreCompleto} url={foco.paciente.avatarUrl} size={64} />
                    <div><h3>{foco.paciente.nombreCompleto}</h3><p className="muted">Expediente #{foco.paciente.id}{foco.paciente.telefono ? ` · ${foco.paciente.telefono}` : ''}</p></div>
                  </div>
                  <div className="dato-ico"><span className="tile sm tile-menta"><Icono nombre="diente" size={18} /></span>
                    <div><small>Tratamiento</small><strong>{foco.tratamientos.map((t) => t.nombre).join(', ')}</strong></div></div>
                  <div className="dato-ico"><span className="tile sm tile-ambar"><Icono nombre="archivo" size={18} /></span>
                    <div><small>Motivo</small><strong>{foco.motivo || 'Sin notas'}</strong></div></div>
                  <div className="dato-ico"><span className="tile sm tile-azul"><Icono nombre="reloj" size={18} /></span>
                    <div><small>Horario</small><strong>{hora(foco.fechaHora)} – {hora(foco.fin)} · {foco.duracionMin} min</strong></div></div>
                  <Link className="btn btn-primary btn-block" style={{ marginTop: '.5rem' }} to={`/dentista/expediente/${foco.paciente.id}?cita=${foco.id}`}>
                    <Icono nombre="portapapeles" size={18} /> Abrir expediente</Link>
                  {puedeCerrar(foco) && <>
                    <button className="btn btn-outline btn-block" style={{ marginTop: '.75rem' }} onClick={() => setModal({ c: foco, tipo: 'atender' })}>
                      <Icono nombre="check" size={18} /> Marcar como atendida</button>
                    <button className="btn btn-texto" style={{ marginTop: '.75rem', width: '100%', color: 'var(--danger)' }} onClick={() => setModal({ c: foco, tipo: 'no-asistio' })}>
                      El paciente no asistió</button>
                  </>}
                </>
              )}
            </section>
          </div>
        </>
      )}
      {modal && <ConfirmModal titulo={modal.tipo === 'atender' ? 'Marcar como atendida' : 'Registrar inasistencia'} peligro={modal.tipo !== 'atender'}
        textoConfirmar={modal.tipo === 'atender' ? 'Atendida' : 'No asistió'}
        mensaje={`${modal.c.paciente.nombreCompleto} · ${hora(modal.c.fechaHora)}. Este cambio no se puede revertir.`}
        onConfirm={() => cerrar(modal.c, modal.tipo)} onClose={() => setModal(null)} />}
    </div>
  )
}
