import { useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import { hoyISO } from '../../utils/format'
import Modal from '../../components/Modal'
import Field from '../../components/Field'
import Icono from '../../components/Icono'

/** Overlay "Registrar paciente". Si se marca "crear acceso", el backend genera una contraseña temporal y la envía por correo. */
export default function PacienteFormModal({ paciente, onClose, onGuardado }) {
  const toast = useToast()
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [creado, setCreado] = useState(null)
  const f = useForm({
    nombre: paciente?.nombre || '', apellidos: paciente?.apellidos || '', email: paciente?.email || '',
    telefono: paciente?.telefono || '', fechaNacimiento: paciente?.fechaNacimiento || '', alergias: paciente?.alergias || '',
    antecedentes: paciente?.antecedentes || '', contactoEmergencia: paciente?.contactoEmergencia || '', crearAcceso: !paciente,
  }, {
    nombre: [v.requerido(), v.nombre(), v.min(2), v.max(80)],
    apellidos: [v.requerido(), v.nombre(), v.min(2), v.max(120)],
    email: [v.requerido('El correo es obligatorio: será su usuario para entrar'), v.email()],
    telefono: [v.requerido('El teléfono es necesario para avisos por SMS y WhatsApp'), v.telefono()],
    fechaNacimiento: [(x) => (x && x >= hoyISO() ? 'La fecha debe ser anterior a hoy' : null)],
    alergias: [v.max(255)], antecedentes: [v.max(2000)], contactoEmergencia: [v.max(150)],
  })

  const submit = f.enviar(async (d) => {
    setErrorGeneral(null)
    const body = { ...d, email: d.email.trim(), fechaNacimiento: d.fechaNacimiento || null }
    try {
      if (paciente) {
        const r = await api.put(`/pacientes/${paciente.id}`, body)
        toast.ok('Datos del paciente actualizados'); onGuardado(r)
      } else {
        const r = await api.post('/pacientes', body)
        if (r.passwordTemporal) setCreado(r)
        else { toast.ok('Paciente registrado'); onGuardado(r.paciente) }
      }
    } catch (e) { setErrorGeneral(e.message); throw e }
  })

  if (creado) {
    return (
      <Modal titulo="Paciente registrado" onClose={() => onGuardado(creado.paciente)} ancho={460}
        footer={<button className="btn btn-primary" onClick={() => onGuardado(creado.paciente)}>Listo</button>}>
        <div className="alerta alerta-ok"><Icono nombre="correo" size={18} /><span>Enviamos sus datos de acceso a <strong>{creado.paciente.email}</strong>.</span></div>
        <p>Si el paciente está en mostrador, también puedes dictarle su contraseña temporal:</p>
        <p className="credencial">{creado.passwordTemporal}</p>
        <p className="muted sm">El sistema le pedirá cambiarla en su primer inicio de sesión.</p>
      </Modal>
    )
  }

  return (
    <Modal titulo={paciente ? 'Editar paciente' : 'Registrar paciente'} subtitulo="Para pacientes que llegan directamente a la clínica." icono="usuarioMas" onClose={onClose} ancho={640}
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={(e) => submit(e).catch(() => {})} disabled={f.enviando}>{f.enviando ? <span className="spinner sm" /> : <Icono nombre="check" size={18} />} {paciente ? 'Guardar cambios' : 'Registrar paciente'}</button>
      </>}>
      <form onSubmit={(e) => submit(e).catch(() => {})} noValidate>
        {errorGeneral && <div className="alerta alerta-error">{errorGeneral}</div>}
        <div className="grid-2">
          <Field label="Nombre(s)" icono="usuario" {...f.campo('nombre')} />
          <Field label="Apellidos" {...f.campo('apellidos')} />
          <Field label="Correo electrónico" icono="correo" type="email" {...f.campo('email')} />
          <Field label="Teléfono celular" icono="telefono" type="tel" inputMode="numeric" maxLength={15} {...f.campo('telefono')} />
          <Field label="Fecha de nacimiento" icono="calendario" type="date" max={hoyISO()} {...f.campo('fechaNacimiento')} />
          <Field label="Contacto de emergencia" icono="telefono" placeholder="Nombre · teléfono" {...f.campo('contactoEmergencia')} />
        </div>
        <Field label="Alergias o condiciones médicas" icono="alerta" placeholder="Ej. penicilina, látex" {...f.campo('alergias')} />
        <Field as="textarea" rows={2} label="Antecedentes médicos" {...f.campo('antecedentes')} />
        {!paciente && (
          <label className="check-linea caja-menta" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={f.valores.crearAcceso} onChange={(e) => f.cambiar('crearAcceso', e.target.checked)} />
            <span><strong className="block">Crear acceso al portal del paciente</strong>
              <small className="muted">Podrá entrar con su correo y una contraseña temporal que le enviaremos. Se le pedirá cambiarla al iniciar sesión por primera vez.</small></span>
          </label>
        )}
      </form>
    </Modal>
  )
}
