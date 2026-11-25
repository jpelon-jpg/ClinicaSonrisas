/** Controles de paginación del lado del servidor (page empieza en 0). */
export default function Paginacion({ pagina, onCambiar }) {
  if (!pagina || pagina.totalElements === 0) return null
  const { page, size, totalElements, totalPages } = pagina
  const desde = page * size + 1
  const hasta = Math.min((page + 1) * size, totalElements)
  const paginas = []
  for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) paginas.push(i)
  return (
    <nav className="paginacion" aria-label="Paginación">
      <span className="muted">Mostrando {desde}–{hasta} de {totalElements}</span>
      <div className="pag-btns">
        <button className="btn btn-ghost sm" disabled={page === 0} onClick={() => onCambiar(page - 1)}>‹ Anterior</button>
        {paginas.map((p) => (
          <button key={p} className={`btn sm ${p === page ? 'btn-primary' : 'btn-ghost'}`} aria-current={p === page ? 'page' : undefined}
            onClick={() => onCambiar(p)}>{p + 1}</button>
        ))}
        <button className="btn btn-ghost sm" disabled={page >= totalPages - 1} onClick={() => onCambiar(page + 1)}>Siguiente ›</button>
      </div>
    </nav>
  )
}
