import { useEffect } from 'react'

export default function Modal({ titulo, onClose, children, footer, ancho = 520 }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', esc)
    document.body.classList.add('no-scroll')
    return () => { document.removeEventListener('keydown', esc); document.body.classList.remove('no-scroll') }
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" style={{ maxWidth: ancho }}>
        <header className="modal-head">
          <h2 id="modal-titulo">{titulo}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}
