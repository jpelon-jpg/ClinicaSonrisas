import { Link } from 'react-router-dom'
import Icono from '../../components/Icono'

/** Marco de las pantallas de acceso: panel teal con la mascota y tarjeta del formulario. */
export default function AuthShell({ children, lema }) {
  const [l1, l2] = lema || ['Cuidamos tu sonrisa,', 'organizamos tu atención.']
  return (
    <div className="auth">
      <section className="auth-marca">
        <Link to="/login" className="marca-blanca">
          <span className="marca-logo"><Icono nombre="diente" size={24} stroke={2} /></span>
          <span className="marca-texto"><strong>Sonrisa</strong><small>Clínica dental</small></span>
        </Link>
        <img className="auth-mascota" src="/mascota.png" alt="Mascota de Sonrisa" />
        <div className="auth-lema">
          <h1>{l1}<span>{l2}</span></h1>
          <p>Agenda, confirma y da seguimiento a las citas de la clínica desde un solo lugar.</p>
        </div>
        <p className="auth-copy">© {new Date().getFullYear()} Sonrisa · Clínica dental</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  )
}
