import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useDebounce } from '../../hooks/useApi'
import Icono from '../../components/Icono'

/** Autocompletado de pacientes: la búsqueda se hace en el servidor. */
export default function BuscarPaciente({ value, onChange, error }) {
  const [texto, setTexto] = useState(value?.nombreCompleto || '')
  const [opciones, setOpciones] = useState([])
  const [abierto, setAbierto] = useState(false)
  const q = useDebounce(texto)

  useEffect(() => {
    if (!abierto || q.trim().length < 2) { setOpciones([]); return }
    api.get('/pacientes', { q, size: 6 }).then((p) => setOpciones(p.content)).catch(() => setOpciones([]))
  }, [q, abierto])

  return (
    <div className={`field combo ${error ? 'field-error' : ''}`}>
      <label htmlFor="buscar-paciente">Paciente</label>
      <div className="control con-icono">
      <Icono nombre="usuario" size={18} className="control-ico" />
      <input id="buscar-paciente" autoComplete="off" placeholder="Escribe nombre o correo…" value={texto}
        onChange={(e) => { setTexto(e.target.value); setAbierto(true); if (value) onChange(null) }}
        onBlur={() => setTimeout(() => setAbierto(false), 150)} aria-invalid={Boolean(error)} />
      </div>
      {abierto && opciones.length > 0 && (
        <ul className="combo-lista" role="listbox">
          {opciones.map((p) => (
            <li key={p.id} role="option" aria-selected={value?.id === p.id}
              onMouseDown={() => { onChange(p); setTexto(p.nombreCompleto); setAbierto(false) }}>
              <strong>{p.nombreCompleto}</strong><small>{p.email}</small>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field-msg">{error}</p>}
    </div>
  )
}
