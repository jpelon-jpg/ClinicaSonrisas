import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useApi, useDebounce } from '../../hooks/useApi'
import { Avatar } from '../../components/Estados'
import Tabla from '../../components/Tabla'

export default function MisPacientes() {
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(0)
  const q = useDebounce(busqueda)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dentista/pacientes', { q, page, size: 10 }), [q, page])
  const columnas = [
    { titulo: 'Paciente', render: (p) => <div className="celda-persona"><Avatar nombre={p.nombreCompleto} url={p.avatarUrl} size={32} />
      <div><strong>{p.nombreCompleto}</strong><small className="block muted">{p.edad != null ? `${p.edad} años` : ''}</small></div></div> },
    { titulo: 'Contacto', render: (p) => <>{p.telefono || '—'}<small className="block muted">{p.email}</small></> },
    { titulo: 'Alergias', render: (p) => p.alergias ? <span className="chip chip-alerta">{p.alergias}</span> : <span className="muted">Ninguna</span> },
    { titulo: '', className: 'acciones', render: (p) => <Link className="btn btn-outline sm" to={`/dentista/expediente/${p.id}`}>Abrir expediente</Link> },
  ]
  return (
    <div className="pagina">
      <header className="pagina-head"><div><h1>Mis pacientes</h1><p className="muted">Pacientes que has atendido o tienes agendados</p></div></header>
      <section className="filtros card">
        <input className="input crece" placeholder="Buscar por nombre o correo…" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} aria-label="Buscar" />
      </section>
      <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} vacio="Aún no tienes pacientes" />
    </div>
  )
}
