/** Marco de las pantallas de acceso: panel de marca + tarjeta del formulario. */
export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <section className="auth-marca">
        <img src="/logo.svg" alt="" width="64" height="64" />
        <h1>Sonrisa</h1>
        <p>Tu clínica dental, siempre a un clic. Agenda, confirma y da seguimiento a tus citas desde cualquier lugar.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  )
}
