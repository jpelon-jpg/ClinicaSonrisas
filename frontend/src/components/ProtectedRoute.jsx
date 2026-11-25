import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { inicioPorRol, useAuth } from '../context/AuthContext'
import { Cargando } from './Estados'

/** Protege rutas por sesión y por rol. */
export default function ProtectedRoute({ roles }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()
  if (cargando) return <div className="pantalla-centro"><Cargando texto="Verificando sesión…" /></div>
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (roles && !roles.some((r) => usuario.roles.includes(r))) return <Navigate to="/403" replace state={{ inicio: inicioPorRol(usuario) }} />
  return <Outlet />
}
