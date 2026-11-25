import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { fecha } from '../../utils/format'
import { Avatar } from '../../components/Estados'
import Tabla from '../../components/Tabla'
import ConfirmModal from '../../components/ConfirmModal'
import UsuarioFormModal from './UsuarioFormModal'

const ETQ = { ADMIN: 'Admin', RECEPCIONISTA: 'Recepción', DENTISTA: 'Dentista', PACIENTE: 'Paciente' }

export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const toast = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [rol, setRol] = useState('')
  const [activo, setActivo] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const q = useDebounce(busqueda)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/usuarios', { q, rol, activo, page, size: 10 }), [q, rol, activo, page])

  const editar = async (u) => {
    let dentista = null
    if (u.roles.includes('DENTISTA')) {
      dentista = (await api.get('/dentistas').catch(() => [])).find((d) => d.usuarioId === u.id) || null
    }
    setModal({ tipo: 'form', u, dentista })
  }

  const columnas = [
    { titulo: 'Usuario', render: (u) => <div className="celda-persona"><Avatar nombre={u.nombreCompleto} url={u.avatarUrl} size={32} />
      <div><strong>{u.nombreCompleto}</strong><small className="block muted">{u.email}</small></div></div> },
    { titulo: 'Roles', render: (u) => <span className="chips">{u.roles.map((r) => <span key={r} className={`chip chip-${r.toLowerCase()}`}>{ETQ[r]}</span>)}</span> },
    { titulo: 'Acceso', render: (u) => u.proveedor === 'LOCAL' ? 'Correo' : u.proveedor.charAt(0) + u.proveedor.slice(1).toLowerCase() },
    { titulo: 'Estado', render: (u) => <span className={`badge badge-${u.activo ? 'ok' : 'muted'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span> },
    { titulo: 'Alta', render: (u) => fecha(u.creadoEn) },
    {
      titulo: 'Acciones', className: 'acciones', render: (u) => (
        <div className="btn-grupo">
          <button className="btn btn-ghost sm" onClick={() => editar(u)}>Editar</button>
          {u.id !== yo.id && <>
            <button className="btn btn-ghost sm" onClick={() => setModal({ tipo: 'estado', u })}>{u.activo ? 'Desactivar' : 'Activar'}</button>
            <button className="btn btn-ghost sm texto-peligro" onClick={() => setModal({ tipo: 'eliminar', u })}>Eliminar</button>
          </>}
        </div>
      ),
    },
  ]

  const m = modal
  const accion = async (fn, ok) => { try { await fn(); toast.ok(ok); recargar() } catch (e) { toast.error(e.message); throw e } }

  return (
    <div className="pagina">
      <header className="pagina-head">
        <div><h1>Usuarios</h1><p className="muted">Cuentas del personal y de pacientes</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ tipo: 'form' })}>＋ Nuevo usuario</button>
      </header>
      <section className="filtros card">
        <input className="input crece" placeholder="Buscar por nombre o correo…" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} aria-label="Buscar" />
        <select className="input" value={rol} onChange={(e) => { setRol(e.target.value); setPage(0) }} aria-label="Rol">
          <option value="">Todos los roles</option>{Object.entries(ETQ).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <select className="input" value={activo} onChange={(e) => { setActivo(e.target.value); setPage(0) }} aria-label="Estado">
          <option value="">Activos e inactivos</option><option value="true">Activos</option><option value="false">Inactivos</option>
        </select>
      </section>
      <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} />

      {m?.tipo === 'form' && <UsuarioFormModal usuario={m.u} dentista={m.dentista} onClose={() => setModal(null)} onGuardado={() => { setModal(null); recargar() }} />}
      {m?.tipo === 'estado' && <ConfirmModal titulo={m.u.activo ? 'Desactivar usuario' : 'Activar usuario'} peligro={m.u.activo}
        textoConfirmar={m.u.activo ? 'Desactivar' : 'Activar'}
        mensaje={m.u.activo ? `${m.u.nombreCompleto} ya no podrá iniciar sesión. Su historial se conserva.` : `${m.u.nombreCompleto} podrá volver a iniciar sesión.`}
        onConfirm={() => accion(() => api.patch(`/usuarios/${m.u.id}/estado`, { activo: !m.u.activo }), 'Estado actualizado')} onClose={() => setModal(null)} />}
      {m?.tipo === 'eliminar' && <ConfirmModal titulo="Eliminar usuario" textoConfirmar="Eliminar"
        mensaje={`Se eliminará la cuenta de ${m.u.nombreCompleto}. Si tiene historial clínico o citas, el sistema pedirá desactivarla en su lugar.`}
        onConfirm={() => accion(() => api.del(`/usuarios/${m.u.id}`), 'Usuario eliminado')} onClose={() => setModal(null)} />}
    </div>
  )
}
