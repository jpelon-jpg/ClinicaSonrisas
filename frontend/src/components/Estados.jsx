import { ESTADOS_CITA } from '../utils/format'

export const Spinner = ({ sm }) => <span className={`spinner ${sm ? 'sm' : ''}`} role="status" aria-label="Cargando" />

export function Cargando({ texto = 'Cargando…' }) {
  return <div className="estado"><Spinner /><p>{texto}</p></div>
}

export function ErrorEstado({ error, onRetry }) {
  return (
    <div className="estado estado-error" role="alert">
      <p className="estado-titulo">{error?.status === 0 ? 'Sin conexión' : 'No pudimos cargar la información'}</p>
      <p>{error?.message}</p>
      {onRetry && <button className="btn btn-outline" onClick={onRetry}>Reintentar</button>}
    </div>
  )
}

export function Vacio({ texto = 'No hay resultados', children }) {
  return <div className="estado"><p className="estado-titulo">{texto}</p>{children}</div>
}

export function Badge({ estado }) {
  const e = ESTADOS_CITA[estado] || { texto: estado, clase: 'muted' }
  return <span className={`badge badge-${e.clase}`}>{e.texto}</span>
}

export function Avatar({ nombre = '', url, size = 36 }) {
  const ini = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return url
    ? <img className="avatar" src={url} alt="" width={size} height={size} style={{ width: size, height: size }} referrerPolicy="no-referrer" />
    : <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>{ini}</span>
}
