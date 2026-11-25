import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, tokenStore } from '../api/client'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCIONISTA: 'RECEPCIONISTA',
  DENTISTA: 'DENTISTA',
  PACIENTE: 'PACIENTE',
}

/** Ruta de inicio según el rol principal del usuario. */
export function inicioPorRol(usuario) {
  const r = usuario?.roles || []
  if (r.includes('ADMIN')) return '/admin'
  if (r.includes('RECEPCIONISTA')) return '/recepcion'
  if (r.includes('DENTISTA')) return '/dentista'
  return '/paciente'
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(Boolean(tokenStore.get()))

  // Al recargar la página se recupera el usuario con el token guardado
  useEffect(() => {
    if (!tokenStore.get()) return
    api.get('/auth/me')
      .then(setUsuario)
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const expirar = () => { tokenStore.clear(); setUsuario(null) }
    window.addEventListener('sonrisa:sesion-expirada', expirar)
    return () => window.removeEventListener('sonrisa:sesion-expirada', expirar)
  }, [])

  const guardarSesion = useCallback((resp) => {
    tokenStore.set(resp.token)
    setUsuario(resp.usuario)
    return resp.usuario
  }, [])

  const login = (email, password) => api.post('/auth/login', { email, password }).then(guardarSesion)
  const loginGoogle = (token) => api.post('/auth/google', { token }).then(guardarSesion)
  const loginFacebook = (token) => api.post('/auth/facebook', { token }).then(guardarSesion)
  const registrar = (datos) => api.post('/auth/register', datos).then(guardarSesion)

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* el token ya podía estar vencido */ }
    tokenStore.clear()
    setUsuario(null)
  }

  const tieneRol = (...roles) => roles.some((r) => usuario?.roles?.includes(r))

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, cargando, login, loginGoogle, loginFacebook, registrar, logout, tieneRol }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
