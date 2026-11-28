import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { hora } from '../../utils/format'
import { fechaHoyLarga, saludo } from '../../utils/saludo'
import { Avatar, Badge, Cargando, Encabezado, ErrorEstado, Kpi, Vacio } from '../../components/Estados'
import Icono from '../../components/Icono'
import CitaFormModal from './CitaFormModal'

export default function RecepcionInicio() {
  const { usuario } = useAuth()
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dashboard/recepcion'))
  const { datos: dentistas } = useApi(() => api.get('/dentistas'))
  const [nueva, setNueva] = useState(false)

  return (
    <div className="pagina">
      <Encabezado titulo={`${saludo()}, ${usuario.nombre}`} subtitulo={`${fechaHoyLarga()} · Este es el resumen de la actividad de hoy.`}>
        <button className="btn btn-primary lg" onClick={() => setNueva(true)}><Icono nombre="mas" /> Nueva cita</button>
      </Encabezado>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> : (
        <>
          <div className="kpis">
            <Kpi icono={<Icono nombre="calendario" />} titulo="Citas de hoy" detalle="Agenda del día" valor={datos.citasHoy} />
            <Kpi icono={<Icono nombre="reloj" />} tono="ambar" titulo="Pendientes" detalle="Por confirmar" valor={datos.pendientesConfirmar} to="/recepcion/solicitudes" />
            <Kpi icono={<Icono nombre="usuarioCheck" />} tono="azul" titulo="Pacientes atendidos" detalle="Hoy" valor={datos.atendidasHoy} />
          </div>
          <section className="tabla-card">
            <div className="card-head" style={{ padding: '1.5rem 1.5rem 0' }}>
              <div><h2>Próximas citas</h2><p>Citas confirmadas más cercanas</p></div>
            </div>
            {datos.proximas.length === 0 ? <Vacio texto="No hay citas próximas" /> : (
              <div className="tabla-scroll">
                <table className="tabla">
                  <thead><tr><th>Hora</th><th>Paciente</th><th>Dentista</th><th>Tratamiento</th><th>Estado</th></tr></thead>
                  <tbody>
                    {datos.proximas.map((c) => (
                      <tr key={c.id}>
                        <td data-label="Hora"><span className="hora-pill">{hora(c.fechaHora)}</span>
                          <small className="block muted">{c.fechaHora.slice(5, 10).split('-').reverse().join('/')}</small></td>
                        <td data-label="Paciente"><div className="celda-persona"><Avatar nombre={c.paciente.nombreCompleto} url={c.paciente.avatarUrl} size={36} /><strong>{c.paciente.nombreCompleto}</strong></div></td>
                        <td data-label="Dentista">{c.dentista.nombreCompleto}</td>
                        <td data-label="Tratamiento">{c.tratamientos.map((t) => t.nombre).join(', ')}</td>
                        <td data-label="Estado"><Badge estado={c.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="centro" style={{ padding: '1.25rem' }}>
              <Link to="/recepcion/citas" className="btn btn-outline">Ver todas las citas <Icono nombre="derecha" size={18} /></Link>
            </div>
            {dentistas?.length > 0 && (
              <div className="tabla-nota"><Icono nombre="usuario" size={18} style={{ color: 'var(--main)' }} />
                <span><strong style={{ color: 'var(--text)' }}>Dentistas en turno: </strong>
                  {dentistas.filter((d) => d.activo).map((d) => `${d.nombreCompleto} (${d.consultorio.toLowerCase()})`).join(' · ')}</span></div>
            )}
          </section>
        </>
      )}
      {nueva && <CitaFormModal onClose={() => setNueva(false)} onGuardada={() => { setNueva(false); recargar() }} />}
    </div>
  )
}
