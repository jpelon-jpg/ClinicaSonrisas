import { api } from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { Cargando, ErrorEstado } from '../../components/Estados'

const PERMISOS = [
  ['Gestionar usuarios y roles', [1, 0, 0, 0]],
  ['Catálogo de tratamientos', [1, 0, 0, 0]],
  ['Bitácora de notificaciones', [1, 0, 0, 0]],
  ['Registrar y editar pacientes', [1, 1, 0, 0]],
  ['Agendar, editar y cancelar citas', [1, 1, 0, 0]],
  ['Confirmar / rechazar solicitudes en línea', [1, 1, 0, 0]],
  ['Marcar cita atendida / no asistió', [1, 1, 1, 0]],
  ['Ver agenda propia', [0, 0, 1, 0]],
  ['Expediente: notas, odontograma, antecedentes', [0, 0, 1, 0]],
  ['Consultar expedientes', [1, 0, 1, 0]],
  ['Solicitar y cancelar citas propias en línea', [0, 0, 0, 1]],
  ['Ver su expediente (solo lectura)', [0, 0, 0, 1]],
]
const COLS = ['ADMIN', 'RECEPCIONISTA', 'DENTISTA', 'PACIENTE']

export default function Roles() {
  const { datos, cargando, error, recargar } = useApi(() => api.get('/roles'))
  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>Roles y permisos</h1><p className="muted">Los permisos se aplican en el backend con Spring Security</p></div></header>
      {error ? <ErrorEstado error={error} onRetry={recargar} /> : cargando ? <Cargando /> : (
        <>
          <div className="kpis">
            {datos.map((r) => <div key={r.id} className="kpi"><span>{r.nombre}</span><strong>{r.totalUsuarios}</strong><small>{r.descripcion}</small></div>)}
          </div>
          <section className="card tabla-scroll">
            <table className="tabla matriz">
              <thead><tr><th>Permiso</th>{COLS.map((c) => <th key={c} className="centro">{c}</th>)}</tr></thead>
              <tbody>
                {PERMISOS.map(([p, v]) => (
                  <tr key={p}><td data-label="Permiso">{p}</td>
                    {v.map((x, i) => <td key={i} data-label={COLS[i]} className="centro">{x ? <span className="si" aria-label="Sí">✓</span> : <span className="muted" aria-label="No">—</span>}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
