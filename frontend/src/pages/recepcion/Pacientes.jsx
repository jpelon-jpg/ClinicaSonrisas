import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { ACCESOS } from '../../utils/format'
import { Avatar } from '../../components/Estados'
import Tabla from '../../components/Tabla'
import ConfirmModal from '../../components/ConfirmModal'
import Modal from '../../components/Modal'
import PacienteFormModal from './PacienteFormModal'

export default function Pacientes() {
  const { tieneRol } = useAuth()
  const toast = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [acceso, setAcceso] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const q = useDebounce(busqueda)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/pacientes', { q, acceso, page, size: 10 }), [q, acceso, page])

  const columnas = [
    { titulo: 'Paciente', render: (p) => <div className="celda-persona"><Avatar nombre={p.nombreCompleto} url={p.avatarUrl} size={32} />
      <div><strong>{p.nombreCompleto}</strong><small className="block muted">{p.edad != null ? `${p.edad} años` : 'Edad sin registrar'}</small></div></div> },
    { titulo: 'Contacto', render: (p) => <>{p.email}<small className="block muted">{p.telefono || '—'}</small></> },
    { titulo: 'Alergias', render: (p) => p.alergias ? <span className="chip chip-alerta">{p.alergias}</span> : <span className="muted">Ninguna</span> },
    { titulo: 'Acceso', render: (p) => <span className="chip">{ACCESOS[p.acceso]}</span> },
    {
      titulo: 'Acciones', className: 'acciones', render: (p) => (
        <div className="btn-grupo">
          <button className="btn btn-ghost sm" onClick={() => setModal({ tipo: 'form', p })}>Editar</button>
          {tieneRol('ADMIN') && <Link className="btn btn-ghost sm" to={`/admin/expediente/${p.id}`}>Expediente</Link>}
          {(p.acceso === 'CORREO' || p.acceso === 'SIN_ACCESO') &&
            <button className="btn btn-ghost sm" onClick={() => setModal({ tipo: 'acceso', p })}>{p.acceso === 'SIN_ACCESO' ? 'Dar acceso' : 'Nueva contraseña'}</button>}
          {tieneRol('ADMIN') && <button className="btn btn-ghost sm texto-peligro" onClick={() => setModal({ tipo: 'eliminar', p })}>Eliminar</button>}
        </div>
      ),
    },
  ]

  const m = modal
  return (
    <div className="pagina">
      <header className="pagina-head">
        <div><h1>Pacientes</h1><p className="muted">{datos ? `${datos.totalElements} registrados` : 'Directorio de pacientes'}</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ tipo: 'form' })}>＋ Registrar paciente</button>
      </header>
      <section className="filtros card">
        <input className="input crece" placeholder="Buscar por nombre, correo o teléfono…" value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} aria-label="Buscar paciente" />
        <select className="input" value={acceso} onChange={(e) => { setAcceso(e.target.value); setPage(0) }} aria-label="Tipo de acceso">
          <option value="">Cualquier acceso</option>
          {Object.entries(ACCESOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
      </section>
      <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} />

      {m?.tipo === 'form' && <PacienteFormModal paciente={m.p} onClose={() => setModal(null)} onGuardado={() => { setModal(null); recargar() }} />}
      {m?.tipo === 'acceso' && <ConfirmModal titulo="Generar contraseña temporal" peligro={false} textoConfirmar="Generar y enviar"
        mensaje={`Se creará una contraseña temporal para ${m.p.nombreCompleto} y se enviará a ${m.p.email}. La anterior dejará de funcionar.`}
        onConfirm={async () => {
          try { const r = await api.post(`/pacientes/${m.p.id}/acceso`); setTimeout(() => setModal({ tipo: 'credencial', r }), 0); recargar() }
          catch (e) { toast.error(e.message); throw e }
        }} onClose={() => setModal((x) => (x?.tipo === 'acceso' ? null : x))} />}
      {m?.tipo === 'credencial' && (
        <Modal titulo="Acceso generado" onClose={() => setModal(null)} ancho={440} footer={<button className="btn btn-primary" onClick={() => setModal(null)}>Listo</button>}>
          <div className="alerta alerta-ok">Enviamos la contraseña a <strong>{m.r.paciente.email}</strong>.</div>
          <p className="credencial">{m.r.passwordTemporal}</p>
        </Modal>
      )}
      {m?.tipo === 'eliminar' && <ConfirmModal titulo="Eliminar paciente" textoConfirmar="Eliminar"
        mensaje={`Se eliminará a ${m.p.nombreCompleto} y su cuenta. Si ya tiene citas o historial clínico, el sistema no lo permitirá (la norma obliga a conservar el expediente).`}
        onConfirm={async () => { try { await api.del(`/pacientes/${m.p.id}`); toast.ok('Paciente eliminado'); recargar() } catch (e) { toast.error(e.message); throw e } }}
        onClose={() => setModal(null)} />}
    </div>
  )
}
