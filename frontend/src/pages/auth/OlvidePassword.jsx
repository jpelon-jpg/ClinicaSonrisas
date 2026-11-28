import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import Field from '../../components/Field'
import AuthShell from './AuthShell'

export default function OlvidePassword() {
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const f = useForm({ email: '' }, { email: [v.requerido('Escribe tu correo'), v.email()] })

  const submit = f.enviar(async ({ email }) => {
    setError(null)
    try { setMensaje((await api.post('/auth/forgot-password', { email: email.trim() })).mensaje) } catch (e) { setError(e.message) }
  })

  return (
    <AuthShell>
      <h2>Recuperar contraseña</h2>
      <p className="auth-sub">Te enviaremos un enlace a tu correo para crear una contraseña nueva. El enlace vence en 30 minutos.</p>
      {mensaje ? <div className="alerta alerta-ok">{mensaje}</div> : (
        <form onSubmit={submit} noValidate>
          {error && <div className="alerta alerta-error">{error}</div>}
          <Field label="Correo electrónico" icono="correo" type="email" {...f.campo('email')} />
          <button className="btn btn-primary btn-block" disabled={f.enviando}>{f.enviando && <span className="spinner sm" />} Enviar enlace</button>
        </form>
      )}
      <p className="centro"><Link to="/login" className="link">Volver a iniciar sesión</Link></p>
    </AuthShell>
  )
}
