import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import Field from '../../components/Field'
import PasswordChecklist from '../../components/PasswordChecklist'
import AuthShell from './AuthShell'

export default function Restablecer() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [hecho, setHecho] = useState(null)
  const [error, setError] = useState(null)
  const f = useForm({ password: '', confirmar: '' }, {
    password: [v.requerido('Crea una contraseña'), v.password()],
    confirmar: [v.requerido('Repite la contraseña'), v.igual('password', 'Las contraseñas no coinciden')],
  })

  const submit = f.enviar(async ({ password }) => {
    setError(null)
    try { setHecho((await api.post('/auth/reset-password', { token, password })).mensaje) } catch (e) { setError(e.message) }
  })

  return (
    <AuthShell>
      <h2>Nueva contraseña</h2>
      {!token && <div className="alerta alerta-error">El enlace está incompleto. Solicita uno nuevo.</div>}
      {hecho ? <div className="alerta alerta-ok">{hecho}</div> : token && (
        <form onSubmit={submit} noValidate>
          {error && <div className="alerta alerta-error">{error}</div>}
          <Field label="Contraseña nueva" icono="candado" type="password" autoComplete="new-password" {...f.campo('password')} />
          <PasswordChecklist value={f.valores.password} />
          <Field label="Confirmar contraseña" icono="candado" type="password" autoComplete="new-password" {...f.campo('confirmar')} />
          <button className="btn btn-primary btn-block" disabled={f.enviando}>{f.enviando && <span className="spinner sm" />} Guardar contraseña</button>
        </form>
      )}
      <p className="centro"><Link to="/login" className="link">Ir a iniciar sesión</Link></p>
    </AuthShell>
  )
}
