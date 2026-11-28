import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import { fecha, hora } from '../../utils/format'
import { Badge, Cargando, Encabezado, ErrorEstado } from '../../components/Estados'
import Icono from '../../components/Icono'
import ConfirmModal from '../../components/ConfirmModal'

const diaLargo = (iso) => {
  const s = new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function PacienteInicio() {
  const { usuario } = useAuth()
  const toast = useToast()
  const [cancelar, setCancelar] = useState(false)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/paciente/resumen'))
  const { datos: visitas } = useApi(() => api.get('/paciente/citas', { tipo: 'historial', page: 0, size: 4 }))
  const c = datos?.proximaCita
  const cancelable = c && new Date(c.fechaHora) > new Date(Date.now() + 24 * 3600000)

  return (
    <div className="pagina">
      <Encabezado titulo={`Hola, ${usuario.nombre}`} subtitulo="Aquí tienes tu próxima cita y tus accesos rápidos.">
        <Link to="/paciente/agendar" className="btn btn-primary lg"><Icono nombre="calendarioMas" /> Agendar nueva cita</Link>
      </Encabezado>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando && !datos ? <Cargando /> : (
        <>
          <div className="dos-col">
            <section className="hero">
              <div className="crece">
                {c ? (
                  <>
                    <span className="hero-estado"><Icono nombre={c.estado === 'CONFIRMADA' ? 'check' : 'reloj'} size={14} stroke={2.5} />
                      Próxima cita · {c.estado === 'CONFIRMADA' ? 'Confirmada' : 'Pendiente de confirmar'}</span>
                    <h2>{diaLargo(c.fechaHora)}</h2>
                    <p className="hero-hora">{hora(c.fechaHora)} h · {c.tratamientos.map((t) => t.nombre).join(', ')}</p>
                    <p className="hero-quien"><Icono nombre="usuario" size={18} /> {c.dentista.nombreCompleto} · {c.dentista.consultorio}</p>
                    <div className="btn-grupo">
                      <Link to="/paciente/citas" className="btn btn-blanco"><Icono nombre="lista" size={18} /> Ver mis citas</Link>
                      {cancelable && <button className="btn btn-hero-sec" onClick={() => setCancelar(true)}><Icono nombre="xCirculo" size={18} /> Cancelar cita</button>}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="hero-estado"><Icono nombre="calendario" size={14} /> Sin citas próximas</span>
                    <h2>¿Agendamos tu siguiente visita?</h2>
                    <p className="hero-hora">Recomendamos una revisión cada 6 meses.</p>
                    <div className="btn-grupo" style={{ marginTop: '1.25rem' }}>
                      <Link to="/paciente/agendar" className="btn btn-blanco"><Icono nombre="calendarioMas" size={18} /> Agendar cita</Link>
                    </div>
                  </>
                )}
              </div>
              <img src="/mascota.png" alt="" />
            </section>

            <section className="card">
              <div className="card-head" style={{ alignItems: 'center' }}>
                <span className="tile tile-ambar"><Icono nombre="campanaAlerta" /></span>
                <div className="crece"><h2>Recordatorios</h2><p>Te avisamos de cada cambio en tus citas</p></div>
              </div>
              {[['Correo electrónico', 'correo'], ['Mensaje SMS', 'telefono'], ['WhatsApp', 'enviar'], ['Un día antes de la cita', 'reloj']].map(([t, ic]) => (
                <div key={t} className="recordatorio">
                  <span className="fila"><Icono nombre={ic} size={18} className="muted" /> {t}</span>
                  <span className="si"><Icono nombre="check" size={14} stroke={2.5} /></span>
                </div>
              ))}
              <p className="muted sm" style={{ marginTop: '.75rem' }}>Asegúrate de que tu teléfono esté correcto en <Link to="/perfil" className="link">Mi perfil</Link>.</p>
            </section>
          </div>

          <div className="tres-col">
            <Link to="/paciente/agendar" className="card acceso-rapido"><span className="tile tile-menta"><Icono nombre="calendarioMas" /></span>
              <span className="crece"><strong>Agendar cita</strong><small>Elige día, hora y dentista</small></span><Icono nombre="derecha" className="muted" /></Link>
            <Link to="/paciente/citas" className="card acceso-rapido"><span className="tile tile-azul"><Icono nombre="lista" /></span>
              <span className="crece"><strong>Mis citas</strong><small>{datos.citasProximas} próximas · {datos.citasAnteriores} anteriores</small></span><Icono nombre="derecha" className="muted" /></Link>
            <Link to="/paciente/expediente" className="card acceso-rapido"><span className="tile tile-morado"><Icono nombre="portapapeles" /></span>
              <span className="crece"><strong>Mi historial</strong><small>Odontograma y tratamientos</small></span><Icono nombre="derecha" className="muted" /></Link>
          </div>

          <section className="tabla-card">
            <div className="card-head" style={{ padding: '1.5rem 1.5rem 0', marginBottom: '1rem' }}>
              <h2>Últimas visitas</h2><Link to="/paciente/citas?tipo=historial" className="link sm">Ver historial completo</Link></div>
            {!visitas?.content?.length ? <p className="muted" style={{ padding: '0 1.5rem 1.5rem' }}>Aún no tienes visitas registradas.</p> : (
              <div className="tabla-scroll">
                <table className="tabla">
                  <tbody>
                    {visitas.content.map((v) => (
                      <tr key={v.id}>
                        <td data-label="Tratamiento"><span className="fila"><Icono nombre="diente" size={20} style={{ color: 'var(--main)' }} /><strong>{v.tratamientos.map((t) => t.nombre).join(', ')}</strong></span></td>
                        <td data-label="Dentista">{v.dentista.nombreCompleto}</td>
                        <td data-label="Fecha">{fecha(v.fechaHora)}</td>
                        <td data-label="Estado"><Badge estado={v.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {cancelar && c && <ConfirmModal titulo="Cancelar cita" pedirMotivo textoConfirmar="Sí, cancelar"
        mensaje={`¿Seguro que quieres cancelar tu cita del ${diaLargo(c.fechaHora).toLowerCase()} a las ${hora(c.fechaHora)}?`}
        onConfirm={async (motivo) => {
          try { await api.patch(`/paciente/citas/${c.id}/cancelar`, { motivo }); toast.ok('Tu cita fue cancelada'); recargar() } catch (e) { toast.error(e.message); throw e }
        }} onClose={() => setCancelar(false)} />}
    </div>
  )
}
