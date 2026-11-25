import { useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useApi, useDebounce } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import { dinero } from '../../utils/format'
import Tabla from '../../components/Tabla'
import Modal from '../../components/Modal'
import Field from '../../components/Field'
import ConfirmModal from '../../components/ConfirmModal'

export default function Tratamientos() {
  const toast = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [activo, setActivo] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const q = useDebounce(busqueda)
  const { datos, cargando, error, recargar } = useApi(() => api.get('/tratamientos', { q, activo, page, size: 10 }), [q, activo, page])

  const columnas = [
    { titulo: 'Tratamiento', render: (t) => <><strong>{t.nombre}</strong><small className="block muted">{t.descripcion}</small></> },
    { titulo: 'Duración', render: (t) => `${t.duracionMin} min` },
    { titulo: 'Precio', render: (t) => dinero(t.precio) },
    { titulo: 'Estado', render: (t) => <span className={`badge badge-${t.activo ? 'ok' : 'muted'}`}>{t.activo ? 'Activo' : 'Inactivo'}</span> },
    { titulo: 'Acciones', className: 'acciones', render: (t) => (
      <div className="btn-grupo">
        <button className="btn btn-ghost sm" onClick={() => setModal({ tipo: 'form', t })}>Editar</button>
        <button className="btn btn-ghost sm texto-peligro" onClick={() => setModal({ tipo: 'eliminar', t })}>Eliminar</button>
      </div>) },
  ]

  return (
    <div className="pagina">
      <header className="pagina-head">
        <div><h1>Tratamientos</h1><p className="muted">Catálogo de servicios y precios</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ tipo: 'form' })}>＋ Nuevo tratamiento</button>
      </header>
      <section className="filtros card">
        <input className="input crece" placeholder="Buscar tratamiento…" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(0) }} aria-label="Buscar" />
        <select className="input" value={activo} onChange={(e) => { setActivo(e.target.value); setPage(0) }} aria-label="Estado">
          <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
        </select>
      </section>
      <Tabla columnas={columnas} pagina={datos} cargando={cargando} error={error} onRetry={recargar} onPagina={setPage} />
      {modal?.tipo === 'form' && <TratamientoModal t={modal.t} onClose={() => setModal(null)} onGuardado={() => { setModal(null); recargar() }} />}
      {modal?.tipo === 'eliminar' && <ConfirmModal titulo="Eliminar tratamiento" textoConfirmar="Eliminar"
        mensaje={`¿Eliminar "${modal.t.nombre}"? Si ya se usó en alguna cita no se podrá borrar; en ese caso desactívalo.`}
        onConfirm={async () => { try { await api.del(`/tratamientos/${modal.t.id}`); toast.ok('Tratamiento eliminado'); recargar() } catch (e) { toast.error(e.message); throw e } }}
        onClose={() => setModal(null)} />}
    </div>
  )
}

function TratamientoModal({ t, onClose, onGuardado }) {
  const toast = useToast()
  const [errorGeneral, setErrorGeneral] = useState(null)
  const f = useForm({ nombre: t?.nombre || '', descripcion: t?.descripcion || '', duracionMin: t?.duracionMin ?? 30, precio: t?.precio ?? '', activo: t?.activo ?? true }, {
    nombre: [v.requerido(), v.min(3), v.max(100)],
    descripcion: [v.requerido('Describe brevemente el tratamiento'), v.max(255)],
    duracionMin: [v.requerido(), v.entre(10, 240, 'Entre 10 y 240 minutos')],
    precio: [v.requerido(), v.entre(0, 100000, 'Escribe un precio entre $0 y $100,000')],
  })
  const submit = f.enviar(async (d) => {
    setErrorGeneral(null)
    const body = { ...d, duracionMin: Number(d.duracionMin), precio: Number(d.precio) }
    try {
      await (t ? api.put(`/tratamientos/${t.id}`, body) : api.post('/tratamientos', body))
      toast.ok(t ? 'Tratamiento actualizado' : 'Tratamiento creado'); onGuardado()
    } catch (e) { setErrorGeneral(e.message); throw e }
  })
  return (
    <Modal titulo={t ? 'Editar tratamiento' : 'Nuevo tratamiento'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>{f.enviando && <span className="spinner sm" />} Guardar</button></>}>
      <form onSubmit={(e) => submit(e).catch(() => {})} noValidate>
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <Field label="Nombre" {...f.campo('nombre')} />
        <Field as="textarea" rows={2} label="Descripción" {...f.campo('descripcion')} />
        <div className="grid-2">
          <Field label="Duración (min)" type="number" min={10} max={240} step={5} {...f.campo('duracionMin')} />
          <Field label="Precio (MXN)" type="number" min={0} step="0.01" {...f.campo('precio')} />
        </div>
        <label className="check-linea"><input type="checkbox" checked={f.valores.activo} onChange={(e) => f.cambiar('activo', e.target.checked)} /> Disponible para agendar</label>
      </form>
    </Modal>
  )
}
