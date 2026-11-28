import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useApi, useDebounce } from '../../hooks/useApi'
import { Avatar, Encabezado } from '../../components/Estados'
import Icono from '../../components/Icono'
import { Buscar } from '../../components/Filtros'
import Tabla from '../../components/Tabla'

export default function MisPacientes() {
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(0)
  const q = useDebounce(busqueda)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/dentista/pacientes', { q, page, size: 10 }), [q, page])
  const columnas = [
    { titulo: 'Paciente', render: (p) => <div className="celda-persona"><Avatar nombre={p.nombreCompleto} url={p.avatarUrl} size={36} />
      <div><strong>{p.nombreCompleto}</strong><small>Expediente #{p.id}{p.edad != null ? ` · ${p.edad} años` : ''}</small></div></div> },
    { titulo: 'Teléfono', render: (p) => p.telefono || <span className="muted">—</span> },
    { titulo: 'Correo', render: (p) => p.email },
    { titulo: 'Alergias', render: (p) => p.alergias ? <span className="chip chip-alerta"><Icono nombre="alerta" size={14} /> {p.alergias}</span> : <span className="muted">Ninguna</span> },
    { titulo: 'Acciones', className: 'acciones-td', render: (p) => <Link className="btn btn-outline sm" to={`/dentista/expediente/${p.id}`}><Icono nombre="portapapeles" size={16} /> Abrir expediente</Link> },
  ]
  return (
    <div className="pagina">
      <Encabezado titulo="Mis pacientes" subtitulo="Pacientes que has atendido o tienes agendados." />
      <section className="tabla-card">
        <div className="filtros"><Buscar placeholder="Buscar por nombre o correo" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} /></div>
        <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} nombre="pacientes" vacio="Aún no tienes pacientes" />
      </section>
    </div>
  )
}
