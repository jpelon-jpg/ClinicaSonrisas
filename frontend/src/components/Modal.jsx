import { useEffect } from 'react'
import Icono from './Icono'

/** Ventana modal con encabezado (ícono, título y subtítulo), cuerpo con scroll y pie de botones. */
export default function Modal({ titulo, subtitulo, icono, tono = 'menta', onClose, children, footer, ancho = 560 }) {
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
          {icono && <span className={`tile tile-${tono}`}><Icono nombre={icono} /></span>}
          <div className="crece">
            <h2 id="modal-titulo">{titulo}</h2>
            {subtitulo && <p className="muted sm">{subtitulo}</p>}
          </div>
          <button className="icon-btn cerrar" onClick={onClose} aria-label="Cerrar"><Icono nombre="x" size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}
