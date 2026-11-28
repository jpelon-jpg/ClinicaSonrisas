import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { fecha } from '../../utils/format'
import { Avatar, Encabezado } from '../../components/Estados'
import Icono from '../../components/Icono'
import { Buscar, Seleccion } from '../../components/Filtros'
import Tabla from '../../components/Tabla'
import ConfirmModal from '../../components/ConfirmModal'
import UsuarioFormModal from './UsuarioFormModal'

const ETQ = { ADMIN: 'Administrador', RECEPCIONISTA: 'Recepcionista', DENTISTA: 'Dentista', PACIENTE: 'Paciente' }
const ICONO_ROL = { ADMIN: 'escudo', RECEPCIONISTA: 'portapapeles', DENTISTA: 'diente', PACIENTE: 'usuario' }

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
    { titulo: 'Usuario', render: (u) => <div className="celda-persona"><Avatar nombre={u.nombreCompleto} url={u.avatarUrl} size={36} />
      <div><strong>{u.nombreCompleto}</strong><small>{u.email}</small></div></div> },
    { titulo: 'Rol', render: (u) => <span className="chips">{u.roles.map((r) => <span key={r} className={`chip chip-${r.toLowerCase()}`}><Icono nombre={ICONO_ROL[r]} size={14} /> {ETQ[r]}</span>)}</span> },
    { titulo: 'Acceso', render: (u) => <span className="acceso"><Icono nombre={u.proveedor === 'LOCAL' ? 'candado' : u.proveedor === 'GOOGLE' ? 'correo' : 'usuario'} size={16} />
      {u.proveedor === 'LOCAL' ? 'Correo y contraseña' : u.proveedor.charAt(0) + u.proveedor.slice(1).toLowerCase()}</span> },
    { titulo: 'Alta', render: (u) => fecha(u.creadoEn) },
    { titulo: 'Activo', render: (u) => <button className={`switch ${u.activo ? 'on' : ''}`} role="switch" aria-checked={u.activo} disabled={u.id === yo.id}
      title={u.id === yo.id ? 'No puedes desactivar tu propia cuenta' : u.activo ? 'Desactivar' : 'Activar'} aria-label={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
      style={u.id === yo.id ? { opacity: .5, cursor: 'not-allowed' } : undefined} onClick={() => u.id !== yo.id && setModal({ tipo: 'estado', u })} /> },
    {
      titulo: 'Acciones', className: 'acciones-td', render: (u) => (
        <div className="acciones">
          <button className="accion" title="Editar" aria-label="Editar" onClick={() => editar(u)}><Icono nombre="lapiz" size={18} /></button>
          {u.id !== yo.id && <button className="accion borrar" title="Eliminar" aria-label="Eliminar" onClick={() => setModal({ tipo: 'eliminar', u })}><Icono nombre="basura" size={18} /></button>}
        </div>
      ),
    },
  ]

  const m = modal
  const accion = async (fn, ok) => { try { await fn(); toast.ok(ok); recargar() } catch (e) { toast.error(e.message); throw e } }

  return (
    <div className="pagina">
      <Encabezado titulo="Usuarios del sistema" subtitulo="Da de alta al personal, asigna roles y controla quién puede ingresar.">
        <button className="btn btn-primary lg" onClick={() => setModal({ tipo: 'form' })}><Icono nombre="usuarioMas" /> Nuevo usuario</button>
      </Encabezado>
      <section className="tabla-card">
        <div className="filtros">
          <Buscar placeholder="Buscar por nombre o correo" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} />
          <Seleccion icono="escudo" etiqueta="Rol" value={rol} onChange={(e) => { setRol(e.target.value); setPage(0) }}>
            <option value="">Todos los roles</option>{Object.entries(ETQ).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </Seleccion>
          <Seleccion icono="check" etiqueta="Estado" value={activo} onChange={(e) => { setActivo(e.target.value); setPage(0) }}>
            <option value="">Todos los estados</option><option value="true">Activos</option><option value="false">Inactivos</option>
          </Seleccion>
        </div>
        <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} nombre="usuarios" />
      </section>

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
