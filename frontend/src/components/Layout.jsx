import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Estados'

const MENUS = {
  ADMIN: [
    { to: '/admin', texto: 'Panel', icono: '▦', end: true },
    { to: '/admin/usuarios', texto: 'Usuarios', icono: '👥' },
    { to: '/admin/roles', texto: 'Roles y permisos', icono: '🛡' },
    { to: '/admin/tratamientos', texto: 'Tratamientos', icono: '🦷' },
    { to: '/recepcion/citas', texto: 'Citas', icono: '📅' },
    { to: '/recepcion/pacientes', texto: 'Pacientes', icono: '🧑' },
    { to: '/recepcion/dentistas', texto: 'Dentistas', icono: '🩺' },
    { to: '/admin/notificaciones', texto: 'Notificaciones', icono: '✉' },
  ],
  RECEPCIONISTA: [
    { to: '/recepcion', texto: 'Inicio', icono: '▦', end: true },
    { to: '/recepcion/citas', texto: 'Citas', icono: '📅' },
    { to: '/recepcion/solicitudes', texto: 'Solicitudes', icono: '🔔' },
    { to: '/recepcion/pacientes', texto: 'Pacientes', icono: '🧑' },
    { to: '/recepcion/dentistas', texto: 'Dentistas', icono: '🩺' },
  ],
  DENTISTA: [
    { to: '/dentista', texto: 'Mi agenda', icono: '📅', end: true },
    { to: '/dentista/pacientes', texto: 'Mis pacientes', icono: '🧑' },
  ],
  PACIENTE: [
    { to: '/paciente', texto: 'Inicio', icono: '▦', end: true },
    { to: '/paciente/agendar', texto: 'Agendar cita', icono: '＋' },
    { to: '/paciente/citas', texto: 'Mis citas', icono: '📅' },
    { to: '/paciente/expediente', texto: 'Mi expediente', icono: '📋' },
  ],
}

const ETIQUETA_ROL = { ADMIN: 'Administrador', RECEPCIONISTA: 'Recepción', DENTISTA: 'Dentista', PACIENTE: 'Paciente' }

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [lateralAbierto, setLateralAbierto] = useState(false)
  const menuRef = useRef(null)

  const rol = ['ADMIN', 'RECEPCIONISTA', 'DENTISTA', 'PACIENTE'].find((r) => usuario.roles.includes(r))
  const items = MENUS[rol]

  useEffect(() => { setLateralAbierto(false); setMenuAbierto(false) }, [location.pathname])
  useEffect(() => {
    const fuera = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuAbierto(false)
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  const salir = async () => { await logout(); navigate('/login', { replace: true }) }

  return (
    <div className={`app ${lateralAbierto ? 'lateral-abierto' : ''}`}>
      <aside className="lateral">
        <Link to="/" className="marca"><img src="/logo.svg" alt="" width="32" height="32" /> <span>Sonrisa</span></Link>
        <p className="lateral-rol">{ETIQUETA_ROL[rol]}</p>
        <nav>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}>
              <span className="nav-ico" aria-hidden>{i.icono}</span>{i.texto}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="fondo-lateral" onClick={() => setLateralAbierto(false)} />

      <div className="principal">
        <header className="navbar">
          <button className="icon-btn hamburguesa" onClick={() => setLateralAbierto(true)} aria-label="Abrir menú">☰</button>
          <div className="navbar-espacio" />
          <div className="usuario-menu" ref={menuRef}>
            <button className="usuario-btn" onClick={() => setMenuAbierto((x) => !x)} aria-haspopup="menu" aria-expanded={menuAbierto}>
              <Avatar nombre={usuario.nombreCompleto} url={usuario.avatarUrl} />
              <span className="usuario-datos">
                <strong>{usuario.nombreCompleto}</strong>
                <small>{usuario.email}</small>
              </span>
              <span aria-hidden>▾</span>
            </button>
            {menuAbierto && (
              <div className="dropdown" role="menu">
                <Link to="/perfil" role="menuitem">Mi perfil</Link>
                <button role="menuitem" onClick={salir}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </header>
        {usuario.debeCambiarPassword && location.pathname !== '/perfil' && (
          <div className="aviso-banda">Estás usando una contraseña temporal. <Link to="/perfil">Cámbiala aquí</Link>.</div>
        )}
        <main className="contenido"><Outlet /></main>
      </div>
    </div>
  )
}
