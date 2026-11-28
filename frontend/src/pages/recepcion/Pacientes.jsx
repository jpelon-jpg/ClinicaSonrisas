import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { ACCESOS } from '../../utils/format'
import { Avatar, Encabezado } from '../../components/Estados'
import Icono from '../../components/Icono'
import { Buscar, Seleccion } from '../../components/Filtros'
import CitaFormModal from './CitaFormModal'
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

  const ICONO_ACCESO = { CORREO: 'candado', GOOGLE: 'correo', FACEBOOK: 'usuario', SIN_ACCESO: 'x' }
  const columnas = [
    { titulo: 'Paciente', render: (p) => <div className="celda-persona"><Avatar nombre={p.nombreCompleto} url={p.avatarUrl} size={36} />
      <div><strong>{p.nombreCompleto}</strong><small>{p.acceso === 'FACEBOOK' ? 'Cuenta de Facebook' : p.email}</small></div></div> },
    { titulo: 'Teléfono', render: (p) => p.telefono || <span className="muted">—</span> },
    { titulo: 'Acceso', render: (p) => <span className="acceso"><Icono nombre={ICONO_ACCESO[p.acceso]} size={16} /> {ACCESOS[p.acceso] === 'Correo y contraseña' ? 'Correo' : ACCESOS[p.acceso]}</span> },
    { titulo: 'Alergias', render: (p) => p.alergias ? <span className="chip chip-alerta"><Icono nombre="alerta" size={14} /> {p.alergias}</span> : <span className="muted">Ninguna</span> },
    { titulo: 'Edad', render: (p) => p.edad != null ? `${p.edad} años` : <span className="muted">—</span> },
    {
      titulo: 'Acciones', className: 'acciones-td', render: (p) => (
        <div className="acciones">
          {tieneRol('ADMIN')
            ? <Link className="accion ver" to={`/admin/expediente/${p.id}`} title="Ver expediente" aria-label="Ver expediente"><Icono nombre="ojo" size={18} /></Link>
            : <button className="accion ver" title="Ver ficha" aria-label="Ver ficha" onClick={() => setModal({ tipo: 'ver', p })}><Icono nombre="ojo" size={18} /></button>}
          <button className="accion" title="Editar" aria-label="Editar" onClick={() => setModal({ tipo: 'form', p })}><Icono nombre="lapiz" size={18} /></button>
          <button className="accion" title="Agendar cita" aria-label="Agendar cita" onClick={() => setModal({ tipo: 'cita', p })}><Icono nombre="calendarioMas" size={18} /></button>
          {(p.acceso === 'CORREO' || p.acceso === 'SIN_ACCESO') &&
            <button className="accion" title={p.acceso === 'SIN_ACCESO' ? 'Dar acceso al portal' : 'Nueva contraseña temporal'} aria-label="Acceso al portal"
              onClick={() => setModal({ tipo: 'acceso', p })}><Icono nombre="candado" size={18} /></button>}
          {tieneRol('ADMIN') && <button className="accion borrar" title="Eliminar" aria-label="Eliminar" onClick={() => setModal({ tipo: 'eliminar', p })}><Icono nombre="basura" size={18} /></button>}
        </div>
      ),
    },
  ]

  const m = modal
  return (
    <div className="pagina">
      <Encabezado titulo="Pacientes" subtitulo="Directorio de pacientes de la clínica. Registra a quien llega sin cuenta.">
        <button className="btn btn-primary lg" onClick={() => setModal({ tipo: 'form' })}><Icono nombre="usuarioMas" /> Registrar paciente</button>
      </Encabezado>
      <section className="tabla-card">
        <div className="filtros">
          <Buscar placeholder="Buscar por nombre, correo o teléfono" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} />
          <Seleccion icono="usuario" etiqueta="Tipo de acceso" value={acceso} onChange={(e) => { setAcceso(e.target.value); setPage(0) }}>
            <option value="">Todos los tipos de acceso</option>
            {Object.entries(ACCESOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </Seleccion>
        </div>
        <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} nombre="pacientes" />
      </section>

      {m?.tipo === 'ver' && (
        <Modal titulo={m.p.nombreCompleto} subtitulo={`Expediente #${m.p.id}`} icono="usuario" onClose={() => setModal(null)}
          footer={<button className="btn btn-primary" onClick={() => setModal({ tipo: 'cita', p: m.p })}><Icono nombre="calendarioMas" size={18} /> Agendar cita</button>}>
          <dl className="datos">
            <dt>Correo</dt><dd>{m.p.email}</dd>
            <dt>Teléfono</dt><dd>{m.p.telefono || '—'}</dd>
            <dt>Edad</dt><dd>{m.p.edad != null ? `${m.p.edad} años` : '—'}</dd>
            <dt>Acceso</dt><dd>{ACCESOS[m.p.acceso]}</dd>
            <dt>Alergias</dt><dd>{m.p.alergias || 'Ninguna conocida'}</dd>
            <dt>Antecedentes</dt><dd>{m.p.antecedentes || '—'}</dd>
            <dt>Emergencia</dt><dd>{m.p.contactoEmergencia || '—'}</dd>
          </dl>
        </Modal>
      )}
      {m?.tipo === 'cita' && <CitaFormModal pacienteInicial={{ id: m.p.id, nombreCompleto: m.p.nombreCompleto }} onClose={() => setModal(null)}
        onGuardada={() => setModal(null)} />}
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
