import { useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import Modal from '../../components/Modal'
import Field from '../../components/Field'
import Icono from '../../components/Icono'
import PasswordChecklist from '../../components/PasswordChecklist'

const ROLES = [
  ['ADMIN', 'Administrador'], ['RECEPCIONISTA', 'Recepcionista'], ['DENTISTA', 'Dentista'], ['PACIENTE', 'Paciente'],
]

export default function UsuarioFormModal({ usuario, dentista, onClose, onGuardado }) {
  const toast = useToast()
  const [errorGeneral, setErrorGeneral] = useState(null)
  const editando = Boolean(usuario)
  const f = useForm({
    nombre: usuario?.nombre || '', apellidos: usuario?.apellidos || '', email: usuario?.email || '', telefono: usuario?.telefono || '',
    password: '', roles: usuario?.roles || [], activo: usuario?.activo ?? true,
    especialidad: dentista?.especialidad || '', cedulaProfesional: dentista?.cedulaProfesional || '', consultorio: dentista?.consultorio || '',
    horaInicio: dentista?.horaInicio?.slice(0, 5) || '09:00', horaFin: dentista?.horaFin?.slice(0, 5) || '18:00',
  }, {
    nombre: [v.requerido(), v.nombre(), v.min(2), v.max(80)],
    apellidos: [v.requerido(), v.nombre(), v.min(2), v.max(120)],
    email: [v.requerido(), v.email()],
    telefono: [v.telefono()],
    password: editando ? [v.password()] : [v.requerido('Asigna una contraseña inicial'), v.password()],
    roles: [(x) => (x.length ? null : 'Selecciona al menos un rol')],
    especialidad: [(x, vals) => (vals.roles.includes('DENTISTA') && !x ? 'Obligatorio para dentistas' : null)],
    cedulaProfesional: [(x, vals) => (vals.roles.includes('DENTISTA') && !x ? 'Obligatoria para dentistas' : null), v.cedula()],
    consultorio: [(x, vals) => (vals.roles.includes('DENTISTA') && !x ? 'Obligatorio para dentistas' : null)],
    horaFin: [(x, vals) => (vals.roles.includes('DENTISTA') && x <= vals.horaInicio ? 'Debe ser posterior a la hora de inicio' : null)],
  })
  const esDentista = f.valores.roles.includes('DENTISTA')

  const toggleRol = (r) => {
    const s = f.valores.roles
    f.cambiar('roles', s.includes(r) ? s.filter((x) => x !== r) : [...s, r])
  }

  const submit = f.enviar(async (d) => {
    setErrorGeneral(null)
    const body = {
      nombre: d.nombre, apellidos: d.apellidos, email: d.email.trim(), telefono: d.telefono || null, roles: d.roles,
      password: d.password || null, activo: d.activo,
      datosDentista: esDentista ? { especialidad: d.especialidad, cedulaProfesional: d.cedulaProfesional, consultorio: d.consultorio, horaInicio: d.horaInicio, horaFin: d.horaFin } : null,
    }
    try {
      const r = editando ? await api.put(`/usuarios/${usuario.id}`, body) : await api.post('/usuarios', body)
      toast.ok(editando ? 'Usuario actualizado' : 'Usuario creado')
      onGuardado(r)
    } catch (e) { setErrorGeneral(e.message); throw e }
  })

  return (
    <Modal titulo={editando ? 'Editar usuario' : 'Nuevo usuario'} subtitulo="Datos de acceso, rol y, si es dentista, su información profesional." icono="usuarioMas" onClose={onClose} ancho={680}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>{f.enviando ? <span className="spinner sm" /> : <Icono nombre="check" size={18} />} Guardar</button>
      </>}>
      <form onSubmit={(e) => submit(e).catch(() => {})} noValidate>
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="grid-2">
          <Field label="Nombre" icono="usuario" {...f.campo('nombre')} />
          <Field label="Apellidos" {...f.campo('apellidos')} />
          <Field label="Correo (usuario de acceso)" icono="correo" type="email" {...f.campo('email')} />
          <Field label="Teléfono" icono="telefono" type="tel" {...f.campo('telefono')} />
        </div>
        <Field label={editando ? 'Nueva contraseña (déjala vacía para no cambiarla)' : 'Contraseña'} type="password" icono="candado" autoComplete="new-password" {...f.campo('password')} />
        {(f.valores.password || !editando) && <PasswordChecklist value={f.valores.password} />}
        <div className={`field ${f.errores.roles ? 'field-error' : ''}`}>
          <span className="label">Roles</span>
          <div className="checks checks-4">
            {ROLES.map(([k, t]) => (
              <label key={k} className={`check ${f.valores.roles.includes(k) ? 'sel' : ''}`}>
                <input type="checkbox" checked={f.valores.roles.includes(k)} onChange={() => toggleRol(k)} /><span>{t}</span>
              </label>
            ))}
          </div>
          {f.errores.roles && <p className="field-msg">{f.errores.roles}</p>}
        </div>
        {esDentista && (
          <fieldset className="subgrupo">
            <legend>Datos profesionales</legend>
            <div className="grid-2">
              <Field label="Especialidad" {...f.campo('especialidad')} />
              <Field label="Cédula profesional" inputMode="numeric" maxLength={8} {...f.campo('cedulaProfesional')} />
              <Field label="Consultorio" {...f.campo('consultorio')} />
              <div className="grid-2">
                <Field label="Entrada" type="time" step="1800" {...f.campo('horaInicio')} />
                <Field label="Salida" type="time" step="1800" {...f.campo('horaFin')} />
              </div>
            </div>
          </fieldset>
        )}
        {editando && (
          <label className="check-linea"><input type="checkbox" checked={f.valores.activo} onChange={(e) => f.cambiar('activo', e.target.checked)} /> Cuenta activa</label>
        )}
      </form>
    </Modal>
  )
}
