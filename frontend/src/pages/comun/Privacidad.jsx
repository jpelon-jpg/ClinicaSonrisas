import { Link } from 'react-router-dom'
import Icono from '../../components/Icono'

/** Aviso de privacidad (requerido por Facebook Login y por la LFPDPPP). Página pública. */
export default function Privacidad() {
  return (
    <div className="legal">
      <header className="legal-head">
        <Link to="/login" className="marca"><span className="marca-logo"><Icono nombre="diente" size={24} stroke={2} /></span><span className="marca-texto"><strong>Sonrisa</strong><small>Clínica dental</small></span></Link>
      </header>
      <main className="legal-cuerpo card">
        <h1>Aviso de privacidad</h1>
        <p className="muted">Última actualización: noviembre de 2026</p>

        <h2>Responsable</h2>
        <p>Sonrisa Clínica Dental (proyecto académico del Instituto Tecnológico de Oaxaca) es responsable del tratamiento de los datos personales que se recaban a través de este sistema, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</p>

        <h2>Datos que recabamos</h2>
        <ul>
          <li>Identificación y contacto: nombre, apellidos, correo electrónico, teléfono y foto de perfil.</li>
          <li>Si inicias sesión con Google o Facebook: únicamente tu nombre, correo y foto pública. No accedemos a tus contactos, publicaciones ni contraseñas.</li>
          <li>Datos de salud (sensibles): alergias, antecedentes médicos, notas de evolución y odontograma, registrados por tu dentista.</li>
        </ul>

        <h2>Para qué los usamos</h2>
        <ul>
          <li>Agendar, confirmar, recordar y cancelar tus citas.</li>
          <li>Enviarte avisos por correo electrónico, SMS y WhatsApp sobre tus citas.</li>
          <li>Integrar y conservar tu expediente clínico, como lo exige la NOM-004-SSA3-2012.</li>
        </ul>
        <p>No vendemos ni compartimos tus datos con terceros con fines comerciales. Los mensajes SMS y WhatsApp se envían mediante Twilio, que actúa como encargado del envío.</p>

        <h2>Seguridad</h2>
        <p>Las contraseñas se guardan cifradas (BCrypt), la comunicación viaja por HTTPS y el acceso al expediente está limitado según tu rol en el sistema.</p>

        <h2>Tus derechos (ARCO) y eliminación de datos</h2>
        <p>Puedes acceder, rectificar o cancelar tus datos, u oponerte a su uso, escribiendo a <strong>privacidad@sonrisa.com</strong>. Si ingresaste con Facebook o Google y quieres que borremos tu cuenta, envía tu solicitud a ese mismo correo. La eliminaremos, salvo la información clínica que la norma obliga a conservar.</p>

        <p><Link to="/login" className="link">Volver a iniciar sesión</Link></p>
      </main>
    </div>
  )
}
