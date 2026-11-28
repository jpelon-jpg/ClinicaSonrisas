import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { v } from '../../utils/validators'
import Field from '../../components/Field'
import PasswordChecklist from '../../components/PasswordChecklist'
import { Avatar, Encabezado } from '../../components/Estados'

export default function Perfil() {
  const { usuario, setUsuario } = useAuth()
  const toast = useToast()
  const [errPwd, setErrPwd] = useState(null)

  const datos = useForm({ nombre: usuario.nombre, apellidos: usuario.apellidos, telefono: usuario.telefono || '', avatarUrl: usuario.avatarUrl || '' }, {
    nombre: [v.requerido(), v.nombre(), v.min(2), v.max(80)],
    apellidos: [v.requerido(), v.nombre(), v.min(2), v.max(120)],
    telefono: [v.telefono()],
    avatarUrl: [(x) => (!x || /^https:\/\/.+/.test(x) ? null : 'Debe ser una URL https://'), v.max(500)],
  })
  const pwd = useForm({ passwordActual: '', passwordNueva: '', confirmar: '' }, {
    passwordActual: [v.requerido('Escribe tu contraseña actual')],
    passwordNueva: [v.requerido('Escribe la nueva contraseña'), v.password()],
    confirmar: [v.requerido('Repite la nueva contraseña'), v.igual('passwordNueva', 'Las contraseñas no coinciden')],
  })

  const guardarDatos = datos.enviar(async (d) => {
    try {
      setUsuario(await api.put('/perfil', { ...d, telefono: d.telefono || null, avatarUrl: d.avatarUrl || null }))
      toast.ok('Perfil actualizado')
    } catch (e) { toast.error(e.message) }
  })

  const cambiarPwd = pwd.enviar(async ({ passwordActual, passwordNueva }) => {
    setErrPwd(null)
    try {
      await api.put('/auth/change-password', { passwordActual, passwordNueva })
      setUsuario({ ...usuario, debeCambiarPassword: false })
      pwd.setValores({ passwordActual: '', passwordNueva: '', confirmar: '' })
      toast.ok('Contraseña actualizada')
    } catch (e) { setErrPwd(e.message) }
  })

  const social = usuario.proveedor !== 'LOCAL'

  return (
    <div className="pagina">
      <Encabezado titulo="Mi perfil" subtitulo="Tus datos de contacto y la seguridad de tu cuenta." />
      <div className="grid-2 alto">
        <section className="card">
          <div className="perfil-top">
            <Avatar nombre={usuario.nombreCompleto} url={datos.valores.avatarUrl || usuario.avatarUrl} size={64} />
            <div><strong>{usuario.nombreCompleto}</strong><p className="muted">{usuario.email}</p>
              <p className="chips">{usuario.roles.map((r) => <span key={r} className="chip">{r}</span>)}
                {social && <span className="chip">Ingresa con {usuario.proveedor.toLowerCase()}</span>}</p></div>
          </div>
          <form onSubmit={guardarDatos} noValidate>
            <div className="grid-2">
              <Field label="Nombre" icono="usuario" {...datos.campo('nombre')} />
              <Field label="Apellidos" {...datos.campo('apellidos')} />
            </div>
            <Field label="Teléfono" icono="telefono" type="tel" {...datos.campo('telefono')} hint="Lo usamos para enviarte SMS y WhatsApp de tus citas" />
            <Field label="URL de tu foto (opcional)" icono="archivo" {...datos.campo('avatarUrl')} />
            <button className="btn btn-primary" disabled={datos.enviando}>{datos.enviando && <span className="spinner sm" />} Guardar cambios</button>
          </form>
        </section>

        <section className="card">
          <h2>Cambiar contraseña</h2>
          {social && !usuario.debeCambiarPassword ? (
            <p className="muted">Entras con tu cuenta de {usuario.proveedor.toLowerCase()}, así que no tienes contraseña en Sonrisa.</p>
          ) : (
            <form onSubmit={cambiarPwd} noValidate>
              {errPwd && <div className="alerta alerta-error">{errPwd}</div>}
              <Field label="Contraseña actual" icono="candado" type="password" autoComplete="current-password" {...pwd.campo('passwordActual')} />
              <Field label="Nueva contraseña" icono="candado" type="password" autoComplete="new-password" {...pwd.campo('passwordNueva')} />
              <PasswordChecklist value={pwd.valores.passwordNueva} />
              <Field label="Confirmar nueva contraseña" icono="candado" type="password" autoComplete="new-password" {...pwd.campo('confirmar')} />
              <button className="btn btn-primary" disabled={pwd.enviando}>{pwd.enviando && <span className="spinner sm" />} Actualizar contraseña</button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
