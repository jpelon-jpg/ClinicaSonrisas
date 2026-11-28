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
  return <span className={`badge badge-${e.clase}`}><i aria-hidden />{e.texto}</span>
}

export function Avatar({ nombre = '', url, size = 36 }) {
  const ini = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  // alterna menta / gris como en el diseño
  const tono = [...nombre].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 ? 'avatar-gris' : ''
  return url
    ? <img className="avatar" src={url} alt="" width={size} height={size} style={{ width: size, height: size }} referrerPolicy="no-referrer" />
    : <span className={`avatar ${tono}`} style={{ width: size, height: size, fontSize: Math.max(11, size * 0.32) }} aria-hidden>{ini}</span>
}

/** Encabezado de página: título grande, subtítulo y acciones a la derecha. */
export function Encabezado({ titulo, subtitulo, children }) {
  return (
    <header className="pagina-head">
      <div><h1>{titulo}</h1>{subtitulo && <p className="pagina-sub">{subtitulo}</p>}</div>
      {children && <div className="btn-grupo">{children}</div>}
    </header>
  )
}

/** Tarjeta de indicador con ícono de color. tono: menta | ambar | azul | rojo | morado */
export function Kpi({ icono, tono = 'menta', titulo, detalle, valor, to, chico }) {
  const Comp = to ? 'a' : 'div'
  return (
    <Comp className="kpi" href={to}>
      <div className="kpi-cab">
        <span className={`tile tile-${tono}`}>{icono}</span>
        <div><span className="kpi-titulo">{titulo}</span>{detalle && <small className={`kpi-detalle ${detalle.tono || ''}`}>{detalle.texto ?? detalle}</small>}</div>
      </div>
      <strong className={chico ? 'kpi-valor chico' : 'kpi-valor'}>{valor}</strong>
    </Comp>
  )
}
