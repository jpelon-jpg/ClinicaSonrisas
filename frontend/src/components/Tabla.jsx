import { Cargando, ErrorEstado, Vacio } from './Estados'
import Paginacion from './Paginacion'

/**
 * Tabla genérica: columnas = [{ titulo, render(fila), className }]
 * pagina = respuesta PageResponse del backend.
 */
export default function Tabla({ columnas, pagina, cargando, error, onRetry, onPagina, vacio = 'No hay registros que coincidan con los filtros' }) {
  if (error) return <ErrorEstado error={error} onRetry={onRetry} />
  const filas = pagina?.content || []
  return (
    <div className="tabla-wrap">
      <div className={`tabla-scroll ${cargando && pagina ? 'recargando' : ''}`}>
        <table className="tabla">
          <thead><tr>{columnas.map((c) => <th key={c.titulo} className={c.className}>{c.titulo}</th>)}</tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>{columnas.map((c) => <td key={c.titulo} data-label={c.titulo} className={c.className}>{c.render(f)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {cargando && !pagina && <Cargando />}
      {!cargando && filas.length === 0 && <Vacio texto={vacio} />}
      <Paginacion pagina={pagina} onCambiar={onPagina} />
    </div>
  )
}
