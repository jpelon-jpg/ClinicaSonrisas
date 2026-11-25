import { useRef, useState } from 'react'

/**
 * Formulario con validación en vivo (al escribir, después de tocar el campo) y al enviar.
 * reglas = { campo: [validador, ...] }  ·  cada validador devuelve un mensaje o null.
 */
export function useForm(inicial, reglas = {}) {
  const [valores, setValoresEstado] = useState(inicial)
  // copia síncrona: permite varios cambiar() seguidos sin perder valores
  const ref = useRef(inicial)
  const setValores = (v) => { ref.current = v; setValoresEstado(v) }
  const [errores, setErrores] = useState({})
  const [tocados, setTocados] = useState({})
  const [enviando, setEnviando] = useState(false)

  const validarCampo = (campo, vals) => {
    for (const regla of reglas[campo] || []) {
      const msg = regla(vals[campo], vals)
      if (msg) return msg
    }
    return null
  }

  const cambiar = (campo, valor) => {
    const nuevos = { ...ref.current, [campo]: valor }
    setValores(nuevos)
    if (tocados[campo] || errores[campo]) {
      setErrores((e) => ({ ...e, [campo]: validarCampo(campo, nuevos) }))
    }
  }

  const tocar = (campo) => {
    setTocados((t) => ({ ...t, [campo]: true }))
    setErrores((e) => ({ ...e, [campo]: validarCampo(campo, ref.current) }))
  }

  const validarTodo = () => {
    const nuevos = {}
    Object.keys(reglas).forEach((c) => { const m = validarCampo(c, ref.current); if (m) nuevos[c] = m })
    setErrores(nuevos)
    setTocados(Object.fromEntries(Object.keys(reglas).map((c) => [c, true])))
    return Object.keys(nuevos).length === 0
  }

  /** Envuelve el submit: valida, marca "enviando" y pinta los errores de campo que devuelva el backend (400). */
  const enviar = (fn) => async (e) => {
    e?.preventDefault()
    if (!validarTodo()) return
    setEnviando(true)
    try {
      await fn(ref.current)
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length) setErrores((x) => ({ ...x, ...err.fieldErrors }))
      throw err
    } finally {
      setEnviando(false)
    }
  }

  // props para <Field>
  const campo = (nombre) => ({
    name: nombre,
    value: valores[nombre] ?? '',
    error: errores[nombre],
    onChange: (e) => cambiar(nombre, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
    onBlur: () => tocar(nombre),
  })

  return { valores, setValores, errores, setErrores, cambiar, campo, enviar, enviando, validarTodo }
}
