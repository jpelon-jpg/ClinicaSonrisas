import { Link, useLocation } from 'react-router-dom'
import { inicioPorRol, useAuth } from '../../context/AuthContext'

export function NoEncontrado() {
  const { usuario } = useAuth()
  return (
    <div className="pantalla-centro"><div className="estado">
      <p className="codigo">404</p><p className="estado-titulo">Esta página no existe</p>
      <Link className="btn btn-primary" to={usuario ? inicioPorRol(usuario) : '/login'}>Ir al inicio</Link>
    </div></div>
  )
}

export function Prohibido() {
  const { state } = useLocation()
  return (
    <div className="pantalla-centro"><div className="estado">
      <p className="codigo">403</p><p className="estado-titulo">No tienes permiso para ver esta sección</p>
      <Link className="btn btn-primary" to={state?.inicio || '/'}>Volver a mi inicio</Link>
    </div></div>
  )
}
