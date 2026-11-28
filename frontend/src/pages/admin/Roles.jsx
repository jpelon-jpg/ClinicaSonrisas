import { Fragment } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { Cargando, Encabezado, ErrorEstado } from '../../components/Estados'
import Icono from '../../components/Icono'

// Matriz de permisos: refleja lo que aplica el backend (SecurityConfig + @PreAuthorize)
const SECCIONES = [
  ['Citas', [
    ['Ver todas las citas de la clínica', [1, 1, 0, 0]],
    ['Crear y reprogramar citas', [1, 1, 0, 1]],
    ['Confirmar o rechazar solicitudes en línea', [1, 1, 0, 0]],
    ['Cancelar citas', [1, 1, 0, 1]],
    ['Eliminar citas del sistema', [1, 0, 0, 0]],
    ['Marcar cita como atendida', [1, 1, 1, 0]],
  ]],
  ['Pacientes y expedientes', [
    ['Registrar y editar datos de pacientes', [1, 1, 0, 0]],
    ['Ver expediente clínico', [1, 0, 1, 1]],
    ['Escribir notas clínicas y odontograma', [0, 0, 1, 0]],
  ]],
  ['Agenda', [
    ['Ver solo sus propias citas', [0, 0, 1, 1]],
    ['Configurar horarios de dentistas', [1, 0, 0, 0]],
  ]],
  ['Administración', [
    ['Gestionar usuarios y roles', [1, 0, 0, 0]],
    ['Ver indicadores y bitácora de avisos', [1, 0, 0, 0]],
    ['Configurar tratamientos y precios', [1, 0, 0, 0]],
  ]],
]
const COLS = [
  ['ADMIN', 'Administrador', 'escudo', 'gris'], ['RECEPCIONISTA', 'Recepcionista', 'portapapeles', 'menta'],
  ['DENTISTA', 'Dentista', 'diente', 'azul'], ['PACIENTE', 'Paciente', 'usuario', 'morado'],
]

export default function Roles() {
  const { datos, cargando, error, recargar } = useApi(() => api.get('/roles'))
  const total = (rol) => datos?.find((r) => r.nombre === rol)?.totalUsuarios ?? 0
  return (
    <div className="pagina">
      <Encabezado titulo="Roles y permisos" subtitulo="Define qué puede hacer cada tipo de usuario dentro del sistema." />
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando ? <Cargando /> : (
        <section className="tabla-card">
          <div className="tabla-scroll">
            <table className="tabla matriz">
              <thead>
                <tr>
                  <th style={{ borderTop: 0, background: '#fff' }}>Permiso</th>
                  {COLS.map(([k, t, ic, tono]) => (
                    <th key={k} style={{ borderTop: 0, background: '#fff' }}>
                      <span className="rol-cab"><span className={`tile sm tile-${tono}`}><Icono nombre={ic} size={18} /></span>
                        <strong>{t}</strong><small>{total(k)} {total(k) === 1 ? 'usuario' : 'usuarios'}</small></span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECCIONES.map(([sec, filas]) => (
                  <Fragment key={sec}>
                    <tr className="seccion"><td colSpan={5}>{sec}</td></tr>
                    {filas.map(([p, v]) => (
                      <tr key={p}>
                        <td data-label="Permiso">{p}</td>
                        {v.map((x, i) => <td key={i} data-label={COLS[i][1]}>
                          {x ? <span className="si" aria-label="Sí"><Icono nombre="check" size={14} stroke={2.5} /></span> : <span className="no" aria-label="No">—</span>}</td>)}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tabla-nota"><Icono nombre="info" size={16} /> Los permisos se aplican en el servidor con Spring Security. Los pacientes solo ven y gestionan sus propias citas y expediente; ingresan con correo y contraseña, Google o Facebook.</p>
        </section>
      )}
    </div>
  )
}
