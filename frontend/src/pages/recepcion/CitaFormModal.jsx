import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import { dinero, hoyISO } from '../../utils/format'
import Modal from '../../components/Modal'
import Field from '../../components/Field'
import BuscarPaciente from './BuscarPaciente'
import HorarioPicker from './HorarioPicker'

/** Alta y edición de citas por recepción (overlay "Nueva cita" del diseño). */
export default function CitaFormModal({ cita, onClose, onGuardada }) {
  const toast = useToast()
  const [dentistas, setDentistas] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [errorGeneral, setErrorGeneral] = useState(null)
  const fh = cita?.fechaHora
  const f = useForm({
    paciente: cita ? { id: cita.paciente.id, nombreCompleto: cita.paciente.nombreCompleto } : null,
    dentistaId: cita?.dentista.id ? String(cita.dentista.id) : '',
    fecha: fh ? fh.slice(0, 10) : '',
    hora: fh ? fh.slice(11, 16) : '',
    tratamientoIds: cita ? cita.tratamientos.map((t) => t.id) : [],
    motivo: cita?.motivo || '',
  }, {
    paciente: [(x) => (x ? null : 'Selecciona un paciente de la lista')],
    dentistaId: [v.requerido('Selecciona un dentista')],
    fecha: [v.requerido('Elige la fecha'), (x) => (x && x < hoyISO() ? 'La fecha no puede ser pasada' : null)],
    hora: [v.requerido('Elige un horario')],
    tratamientoIds: [(x) => (x.length ? null : 'Elige al menos un tratamiento')],
    motivo: [v.max(255)],
  })

  useEffect(() => {
    api.get('/dentistas').then((d) => setDentistas(d.filter((x) => x.activo))).catch((e) => setErrorGeneral(e.message))
    api.get('/tratamientos/activos').then(setTratamientos).catch((e) => setErrorGeneral(e.message))
  }, [])

  const toggleTrat = (id) => {
    const s = f.valores.tratamientoIds
    f.cambiar('tratamientoIds', s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }
  const seleccion = tratamientos.filter((t) => f.valores.tratamientoIds.includes(t.id))
  const total = seleccion.reduce((a, t) => a + Number(t.precio), 0)
  const duracion = seleccion.reduce((a, t) => a + t.duracionMin, 0)

  const submit = f.enviar(async (d) => {
    setErrorGeneral(null)
    const body = {
      pacienteId: d.paciente.id, dentistaId: Number(d.dentistaId), fechaHora: `${d.fecha}T${d.hora}:00`,
      tratamientoIds: d.tratamientoIds, motivo: d.motivo || null,
    }
    try {
      const r = cita ? await api.put(`/citas/${cita.id}`, body) : await api.post('/citas', body)
      toast.ok(cita ? 'Cita actualizada' : 'Cita agendada y confirmada. Se notificó al paciente.')
      onGuardada(r)
    } catch (e) { setErrorGeneral(e.message); throw e }
  })

  return (
    <Modal titulo={cita ? 'Editar cita' : 'Nueva cita'} onClose={onClose} ancho={640}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>
          {f.enviando && <span className="spinner sm" />} {cita ? 'Guardar cambios' : 'Agendar cita'}</button>
      </>}>
      <form onSubmit={(e) => submit(e).catch(() => {})} noValidate>
        {errorGeneral && <div className="alerta alerta-error" role="alert">{errorGeneral}</div>}
        <BuscarPaciente value={f.valores.paciente} onChange={(p) => f.cambiar('paciente', p)} error={f.errores.paciente} />
        <div className="grid-2">
          <Field as="select" label="Dentista" {...f.campo('dentistaId')} onChange={(e) => { f.cambiar('dentistaId', e.target.value); f.cambiar('hora', '') }}>
            <option value="">Selecciona…</option>
            {dentistas.map((d) => <option key={d.id} value={d.id}>{d.nombreCompleto} · {d.especialidad}</option>)}
          </Field>
          <Field label="Fecha" type="date" min={hoyISO()} {...f.campo('fecha')} />
        </div>
        <HorarioPicker dentistaId={f.valores.dentistaId} fecha={f.valores.fecha} value={f.valores.hora}
          horaActual={cita && f.valores.fecha === fh?.slice(0, 10) && String(cita.dentista.id) === f.valores.dentistaId ? fh.slice(11, 16) : null}
          onChange={(h) => f.cambiar('hora', h)} error={f.errores.hora} />
        <div className={`field ${f.errores.tratamientoIds ? 'field-error' : ''}`}>
          <span className="label">Tratamientos</span>
          <div className="checks">
            {tratamientos.map((t) => (
              <label key={t.id} className={`check ${f.valores.tratamientoIds.includes(t.id) ? 'sel' : ''}`}>
                <input type="checkbox" checked={f.valores.tratamientoIds.includes(t.id)} onChange={() => toggleTrat(t.id)} />
                <span>{t.nombre}</span><small>{t.duracionMin} min · {dinero(t.precio)}</small>
              </label>
            ))}
          </div>
          {f.errores.tratamientoIds && <p className="field-msg">{f.errores.tratamientoIds}</p>}
          {seleccion.length > 0 && <p className="field-hint">Duración estimada {duracion} min · Total {dinero(total)}</p>}
        </div>
        <Field as="textarea" rows={2} label="Motivo / notas (opcional)" maxLength={255} {...f.campo('motivo')} />
      </form>
    </Modal>
  )
}
