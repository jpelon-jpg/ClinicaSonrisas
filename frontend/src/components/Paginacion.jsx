import Icono from './Icono'

/** Paginación del lado del servidor (page empieza en 0). */
export default function Paginacion({ pagina, onCambiar, nombre = 'registros' }) {
  if (!pagina || pagina.totalElements === 0) return null
  const { page, size, totalElements, totalPages } = pagina
  const desde = page * size + 1
  const hasta = Math.min((page + 1) * size, totalElements)
  const paginas = []
  for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) paginas.push(i)
  return (
    <nav className="paginacion" aria-label="Paginación">
      <span className="muted">Mostrando {desde}–{hasta} de {totalElements} {nombre}</span>
      <div className="pag-btns">
        <button className="btn" disabled={page === 0} onClick={() => onCambiar(page - 1)}><Icono nombre="izquierda" size={16} /> Anterior</button>
        {paginas[0] > 0 && <><button className="btn" onClick={() => onCambiar(0)}>1</button>{paginas[0] > 1 && <span className="muted" style={{ alignSelf: 'center' }}>…</span>}</>}
        {paginas.map((p) => (
          <button key={p} className={`btn ${p === page ? 'btn-primary' : ''}`} aria-current={p === page ? 'page' : undefined}
            onClick={() => onCambiar(p)}>{p + 1}</button>
        ))}
        {paginas[paginas.length - 1] < totalPages - 1 && <>{paginas[paginas.length - 1] < totalPages - 2 && <span className="muted" style={{ alignSelf: 'center' }}>…</span>}<button className="btn" onClick={() => onCambiar(totalPages - 1)}>{totalPages}</button></>}
        <button className="btn" disabled={page >= totalPages - 1} onClick={() => onCambiar(page + 1)}>Siguiente <Icono nombre="derecha" size={16} /></button>
      </div>
    </nav>
  )
}
