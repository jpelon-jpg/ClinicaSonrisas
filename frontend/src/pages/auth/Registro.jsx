import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import Field from '../../components/Field'
import PasswordChecklist from '../../components/PasswordChecklist'
import AuthShell from './AuthShell'

export default function Registro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [errorGeneral, setErrorGeneral] = useState(null)
  const f = useForm({ nombre: '', apellidos: '', email: '', telefono: '', password: '', confirmar: '' }, {
    nombre: [v.requerido('Escribe tu nombre'), v.nombre(), v.min(2), v.max(80)],
    apellidos: [v.requerido('Escribe tus apellidos'), v.nombre(), v.min(2), v.max(120)],
    email: [v.requerido('Escribe tu correo'), v.email()],
    telefono: [v.requerido('Escribe tu teléfono para avisarte de tus citas'), v.telefono()],
    password: [v.requerido('Crea una contraseña'), v.password()],
    confirmar: [v.requerido('Repite la contraseña'), v.igual('password', 'Las contraseñas no coinciden')],
  })

  const submit = f.enviar(async ({ confirmar, ...datos }) => {
    setErrorGeneral(null)
    try {
      await registrar({ ...datos, email: datos.email.trim() })
      navigate('/paciente', { replace: true })
    } catch (e) { setErrorGeneral(e.message) }
  })

  return (
    <AuthShell>
      <h2>Crear cuenta de paciente</h2>
      {errorGeneral && <div className="alerta alerta-error" role="alert">{errorGeneral}</div>}
      <form onSubmit={submit} noValidate>
        <div className="grid-2">
          <Field label="Nombre" autoComplete="given-name" {...f.campo('nombre')} />
          <Field label="Apellidos" autoComplete="family-name" {...f.campo('apellidos')} />
        </div>
        <Field label="Correo electrónico" type="email" autoComplete="email" {...f.campo('email')} />
        <Field label="Teléfono celular" type="tel" inputMode="numeric" placeholder="9511234567" maxLength={15} {...f.campo('telefono')} />
        <Field label="Contraseña" type="password" autoComplete="new-password" {...f.campo('password')} />
        <PasswordChecklist value={f.valores.password} />
        <Field label="Confirmar contraseña" type="password" autoComplete="new-password" {...f.campo('confirmar')} />
        <button className="btn btn-primary btn-block" disabled={f.enviando}>{f.enviando && <span className="spinner sm" />} Crear cuenta</button>
      </form>
      <p className="centro muted">¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión</Link></p>
    </AuthShell>
  )
}
