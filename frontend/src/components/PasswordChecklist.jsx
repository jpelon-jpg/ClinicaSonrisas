import { reglasPassword } from '../utils/validators'

/** Lista en vivo de requisitos de la contraseña, se muestra debajo del input. */
export default function PasswordChecklist({ value = '' }) {
  return (
    <ul className="pwd-check" aria-label="Requisitos de la contraseña">
      {reglasPassword.map((r) => {
        const ok = r.test(value)
        return <li key={r.id} className={ok ? 'ok' : ''}><span aria-hidden>{ok ? '✓' : '○'}</span> {r.texto}</li>
      })}
    </ul>
  )
}
