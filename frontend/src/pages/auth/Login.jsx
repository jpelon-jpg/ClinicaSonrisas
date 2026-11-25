import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { inicioPorRol, useAuth } from '../../context/AuthContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import Field from '../../components/Field'
import SocialButtons from '../../components/SocialButtons'
import AuthShell from './AuthShell'

export default function Login() {
  const { usuario, login, loginGoogle, loginFacebook } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('paciente')
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [verPwd, setVerPwd] = useState(false)
  const f = useForm({ email: '', password: '' }, {
    email: [v.requerido('Escribe tu correo'), v.email()],
    password: [v.requerido('Escribe tu contraseña')],
  })

  const entrar = useCallback((u) => navigate(location.state?.desde || inicioPorRol(u), { replace: true }), [navigate, location.state])
  const fallo = (e) => setErrorGeneral(e.message)

  const onGoogle = useCallback((cred) => { setErrorGeneral(null); loginGoogle(cred).then(entrar).catch(fallo) }, [loginGoogle, entrar])
  const onFacebook = (tok) => { setErrorGeneral(null); loginFacebook(tok).then(entrar).catch(fallo) }

  if (usuario) return <Navigate to={inicioPorRol(usuario)} replace />

  const submit = f.enviar(async ({ email, password }) => {
    setErrorGeneral(null)
    try { entrar(await login(email.trim(), password)) } catch (e) { fallo(e) }
  })

  return (
    <AuthShell>
      <h2>Iniciar sesión</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'paciente'} className={tab === 'paciente' ? 'activo' : ''} onClick={() => setTab('paciente')}>Soy paciente</button>
        <button role="tab" aria-selected={tab === 'personal'} className={tab === 'personal' ? 'activo' : ''} onClick={() => setTab('personal')}>Personal de la clínica</button>
      </div>

      {errorGeneral && <div className="alerta alerta-error" role="alert">{errorGeneral}</div>}

      <form onSubmit={submit} noValidate>
        <Field label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" {...f.campo('email')} />
        <div className="field-pwd">
          <Field label="Contraseña" type={verPwd ? 'text' : 'password'} autoComplete="current-password" {...f.campo('password')} />
          <button type="button" className="ver-pwd" onClick={() => setVerPwd((x) => !x)}>{verPwd ? 'Ocultar' : 'Mostrar'}</button>
        </div>
        <div className="fila-entre">
          <span className="muted sm">{tab === 'paciente' ? 'Usa el correo y la contraseña que te dio recepción' : 'Acceso para administración, recepción y dentistas'}</span>
          <Link to="/olvide-password" className="link sm">¿Olvidaste tu contraseña?</Link>
        </div>
        <button className="btn btn-primary btn-block" disabled={f.enviando}>
          {f.enviando && <span className="spinner sm" />} Entrar
        </button>
      </form>

      {tab === 'paciente' && (
        <>
          <div className="separador"><span>o continúa con</span></div>
          <SocialButtons onGoogle={onGoogle} onFacebook={onFacebook} />
          <p className="centro muted">¿Primera vez? <Link to="/registro" className="link">Crea tu cuenta</Link></p>
          <p className="centro muted sm">Al continuar aceptas nuestro <Link to="/privacidad" className="link">aviso de privacidad</Link>.</p>
        </>
      )}
    </AuthShell>
  )
}
