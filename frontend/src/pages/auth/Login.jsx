import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { inicioPorRol, useAuth } from '../../context/AuthContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import Field from '../../components/Field'
import SocialButtons from '../../components/SocialButtons'
import AuthShell from './AuthShell'
import Icono from '../../components/Icono'

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

  const lema = tab === 'paciente' ? ['Tu sonrisa,', 'a un clic de distancia.'] : ['Cuidamos tu sonrisa,', 'organizamos tu atención.']

  return (
    <AuthShell lema={lema}>
      <h2>Bienvenido</h2>
      <p className="auth-sub">Elige cómo quieres ingresar.</p>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'personal'} className={tab === 'personal' ? 'activo' : ''} onClick={() => setTab('personal')}>
          <Icono nombre="portapapeles" size={18} /> Personal de la clínica</button>
        <button role="tab" aria-selected={tab === 'paciente'} className={tab === 'paciente' ? 'activo' : ''} onClick={() => setTab('paciente')}>
          <Icono nombre="usuario" size={18} /> Soy paciente</button>
      </div>

      {errorGeneral && <div className="alerta alerta-error" role="alert"><Icono nombre="alerta" size={18} />{errorGeneral}</div>}

      <form onSubmit={submit} noValidate>
        <Field label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" icono="correo" {...f.campo('email')} />
        <Field label="Contraseña" type={verPwd ? 'text' : 'password'} autoComplete="current-password" icono="candado" {...f.campo('password')}
          extra={<button type="button" className="ver-pwd" onClick={() => setVerPwd((x) => !x)} aria-label={verPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Icono nombre={verPwd ? 'ocultar' : 'ojo'} size={18} /></button>} />
        <div className="fila-entre" style={{ justifyContent: 'flex-end', margin: '-.25rem 0 1.25rem' }}>
          <Link to="/olvide-password" className="link sm">¿Olvidaste tu contraseña?</Link>
        </div>
        <button className="btn btn-primary btn-block" disabled={f.enviando}>
          {f.enviando && <span className="spinner sm" />} Iniciar sesión
        </button>
      </form>

      {tab === 'paciente' ? (
        <>
          <div className="separador"><span>o continúa con</span></div>
          <SocialButtons onGoogle={onGoogle} onFacebook={onFacebook} />
          <div className="alerta alerta-menta"><Icono nombre="info" size={18} />
            <span>¿Te registraste en la clínica? Usa el correo y la contraseña que te dio recepción. ¿Primera vez? <Link to="/registro" className="link">Crea tu cuenta</Link>.</span></div>
          <p className="auth-pie">Al continuar aceptas nuestro <Link to="/privacidad" className="link">aviso de privacidad</Link>.</p>
        </>
      ) : (
        <>
          <div className="alerta alerta-menta" style={{ marginTop: '1.5rem' }}><Icono nombre="escudo" size={18} />
            <span><strong>Administradores, recepcionistas y dentistas.</strong>Tu rol y permisos se asignan según tu cuenta.</span></div>
          <p className="auth-pie">Sistema de gestión de citas · Sonrisa</p>
        </>
      )}
    </AuthShell>
  )
}
