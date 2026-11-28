import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Estados'
import Icono from './Icono'

const MENUS = {
  ADMIN: [
    { to: '/admin', texto: 'Panel general', icono: 'grid', end: true },
    { to: '/recepcion/citas', texto: 'Citas', icono: 'calendario' },
    { to: '/admin/usuarios', texto: 'Usuarios', icono: 'usuarios' },
    { to: '/admin/roles', texto: 'Roles y permisos', icono: 'escudo' },
    { to: '/recepcion/pacientes', texto: 'Pacientes', icono: 'usuario' },
    { to: '/recepcion/dentistas', texto: 'Dentistas', icono: 'diente' },
    { to: '/admin/tratamientos', texto: 'Tratamientos', icono: 'portapapeles' },
    { to: '/admin/notificaciones', texto: 'Notificaciones', icono: 'enviar' },
  ],
  RECEPCIONISTA: [
    { to: '/recepcion', texto: 'Panel principal', icono: 'grid', end: true },
    { to: '/recepcion/citas', texto: 'Citas', icono: 'calendario' },
    { to: '/recepcion/solicitudes', texto: 'Solicitudes', icono: 'campanaAlerta', contador: true },
    { to: '/recepcion/pacientes', texto: 'Pacientes', icono: 'usuarios' },
    { to: '/recepcion/dentistas', texto: 'Dentistas', icono: 'usuario' },
  ],
  DENTISTA: [
    { to: '/dentista', texto: 'Mi agenda', icono: 'calendario', end: true },
    { to: '/dentista/pacientes', texto: 'Mis pacientes', icono: 'usuarios' },
    { to: '/perfil', texto: 'Mi perfil', icono: 'usuario' },
  ],
  PACIENTE: [
    { to: '/paciente', texto: 'Inicio', icono: 'casa', end: true },
    { to: '/paciente/agendar', texto: 'Agendar cita', icono: 'calendarioMas' },
    { to: '/paciente/citas', texto: 'Mis citas', icono: 'lista' },
    { to: '/paciente/expediente', texto: 'Mi historial', icono: 'portapapeles' },
    { to: '/perfil', texto: 'Mi perfil', icono: 'usuario' },
  ],
}

const ETIQUETA_ROL = { ADMIN: 'Administrador', RECEPCIONISTA: 'Recepcionista', DENTISTA: 'Dentista', PACIENTE: 'Paciente' }

// Título de la barra superior según la ruta
const TITULOS = [
  ['/admin/usuarios', 'Usuarios'], ['/admin/roles', 'Roles y permisos'], ['/admin/tratamientos', 'Tratamientos'],
  ['/admin/notificaciones', 'Notificaciones'], ['/admin/expediente', 'Expediente clínico'], ['/admin', 'Panel general'],
  ['/recepcion/citas', 'Citas'], ['/recepcion/solicitudes', 'Solicitudes'], ['/recepcion/pacientes', 'Pacientes'],
  ['/recepcion/dentistas', 'Dentistas'], ['/recepcion', 'Panel principal'],
  ['/dentista/pacientes', 'Mis pacientes'], ['/dentista/expediente', 'Expediente clínico'], ['/dentista', 'Mi agenda'],
  ['/paciente/agendar', 'Agendar cita'], ['/paciente/citas', 'Mis citas'], ['/paciente/expediente', 'Mi historial'], ['/paciente', 'Inicio'],
  ['/perfil', 'Mi perfil'],
]
const DESTINO_CAMPANA = { ADMIN: '/admin/notificaciones', RECEPCIONISTA: '/recepcion/solicitudes', DENTISTA: '/dentista', PACIENTE: '/paciente/citas' }

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [lateralAbierto, setLateralAbierto] = useState(false)
  const [pendientes, setPendientes] = useState(0)
  const menuRef = useRef(null)

  const rol = ['ADMIN', 'RECEPCIONISTA', 'DENTISTA', 'PACIENTE'].find((r) => usuario.roles.includes(r))
  const items = MENUS[rol]
  const titulo = (TITULOS.find(([p]) => location.pathname.startsWith(p)) || [null, 'Sonrisa'])[1]
  const verPendientes = rol === 'ADMIN' || rol === 'RECEPCIONISTA'

  useEffect(() => { setLateralAbierto(false); setMenuAbierto(false) }, [location.pathname])
  useEffect(() => {
    const fuera = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuAbierto(false)
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])
  // Contador de solicitudes en línea pendientes (recepción y administración)
  useEffect(() => {
    if (!verPendientes) return
    api.get('/citas', { estado: 'PENDIENTE', page: 0, size: 1 })
      .then((p) => setPendientes(p.totalElements)).catch(() => {})
  }, [verPendientes, location.pathname])

  const salir = async () => { await logout(); navigate('/login', { replace: true }) }
  const subtitulo = rol === 'PACIENTE' && usuario.proveedor !== 'LOCAL'
    ? `Paciente · ${usuario.proveedor.charAt(0)}${usuario.proveedor.slice(1).toLowerCase()}`
    : ETIQUETA_ROL[rol]

  return (
    <div className={`app ${lateralAbierto ? 'lateral-abierto' : ''}`}>
      <aside className="lateral">
        <Link to="/" className="marca">
          <span className="marca-logo"><Icono nombre="diente" size={24} stroke={2} /></span>
          <span className="marca-texto"><strong>Sonrisa</strong><small>Clínica dental</small></span>
        </Link>
        <div className="lateral-sep" />
        <span className="lateral-rol">{ETIQUETA_ROL[rol]}</span>
        <nav>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}>
              <Icono nombre={i.icono} size={20} />
              <span className="crece">{i.texto}</span>
              {i.contador && pendientes > 0 && <span className="nav-badge">{pendientes}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="lateral-pie">
          {rol === 'PACIENTE' && (
            <div className="consejo">
              <div><strong>Consejo del día</strong><p>Cepíllate 3 veces al día y usa hilo dental.</p></div>
              <img src="/mascota.png" alt="" />
            </div>
          )}
          <div className="lateral-sep" />
          <button className="nav-item" onClick={salir}><Icono nombre="salir" size={20} /> Cerrar sesión</button>
        </div>
      </aside>
      <div className="fondo-lateral" onClick={() => setLateralAbierto(false)} />

      <div className="principal">
        <header className="navbar">
          <button className="icon-btn hamburguesa" onClick={() => setLateralAbierto(true)} aria-label="Abrir menú"><Icono nombre="menu" /></button>
          <h2 className="navbar-titulo">{titulo}</h2>
          <div className="navbar-espacio" />
          <Link to={DESTINO_CAMPANA[rol]} className="campana" aria-label="Avisos">
            <Icono nombre="campana" size={20} />
            {verPendientes && pendientes > 0 && <span className="campana-punto" />}
          </Link>
          <div className="usuario-menu" ref={menuRef}>
            <button className="usuario-btn" onClick={() => setMenuAbierto((x) => !x)} aria-haspopup="menu" aria-expanded={menuAbierto}>
              <Avatar nombre={usuario.nombreCompleto} url={usuario.avatarUrl} size={40} />
              <span className="usuario-datos">
                <strong>{usuario.nombreCompleto}</strong>
                <small>{subtitulo}</small>
              </span>
              <Icono nombre="abajo" size={18} className="muted" />
            </button>
            {menuAbierto && (
              <div className="dropdown" role="menu">
                <div className="dropdown-cab"><strong>{usuario.nombreCompleto}</strong><small>{usuario.email}</small></div>
                <Link to="/perfil" role="menuitem"><Icono nombre="usuario" size={18} /> Mi perfil</Link>
                <button role="menuitem" onClick={salir}><Icono nombre="salir" size={18} /> Cerrar sesión</button>
              </div>
            )}
          </div>
        </header>
        {usuario.debeCambiarPassword && location.pathname !== '/perfil' && (
          <div className="aviso-banda"><Icono nombre="alerta" size={18} /> Estás usando una contraseña temporal. <Link to="/perfil">Cámbiala aquí</Link>.</div>
        )}
        <main className="contenido"><Outlet /></main>
      </div>
    </div>
  )
}
