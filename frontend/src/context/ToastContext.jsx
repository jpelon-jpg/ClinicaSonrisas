import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

/** Avisos no bloqueantes (sin diálogos nativos del navegador). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const quitar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const mostrar = useCallback((mensaje, tipo = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, mensaje, tipo }])
    setTimeout(() => quitar(id), 4500)
  }, [quitar])

  const toast = {
    ok: (m) => mostrar(m, 'ok'),
    error: (m) => mostrar(m, 'error'),
    info: (m) => mostrar(m, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            <span>{t.mensaje}</span>
            <button className="toast-x" onClick={() => quitar(t.id)} aria-label="Cerrar aviso">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
