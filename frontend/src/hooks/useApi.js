import { useCallback, useEffect, useRef, useState } from 'react'

/** Ejecuta una petición GET y expone datos, estado de carga, error y recarga. */
export function useApi(fn, deps = []) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const ultima = useRef(0)

  const cargar = useCallback(() => {
    const id = ++ultima.current
    setCargando(true)
    setError(null)
    return fn()
      .then((d) => { if (id === ultima.current) setDatos(d) })
      .catch((e) => { if (id === ultima.current) setError(e) })
      .finally(() => { if (id === ultima.current) setCargando(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { cargar() }, [cargar])

  return { datos, cargando, error, recargar: cargar, setDatos }
}

/** Devuelve el valor con retraso (para no consultar al servidor en cada tecla). */
export function useDebounce(valor, ms = 350) {
  const [v, setV] = useState(valor)
  useEffect(() => { const t = setTimeout(() => setV(valor), ms); return () => clearTimeout(t) }, [valor, ms])
  return v
}
