import Icono from './Icono'

/**
 * Campo de formulario con etiqueta, ícono opcional dentro del input y mensaje de error debajo.
 * icono: nombre del ícono (ver Icono.jsx)  ·  extra: elemento a la derecha del input (p. ej. "Mostrar").
 */
export default function Field({ label, error, as = 'input', hint, icono, extra, children, className = '', ...props }) {
  const id = props.id || `f-${props.name}`
  const Comp = as
  const aria = { 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-err` : undefined }
  return (
    <div className={`field ${error ? 'field-error' : ''} ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className={`control ${icono ? 'con-icono' : ''} ${extra ? 'con-extra' : ''} ${as === 'select' ? 'es-select' : ''}`}>
        {icono && <Icono nombre={icono} size={18} className="control-ico" />}
        {as === 'select'
          ? <select id={id} {...aria} {...props}>{children}</select>
          : <Comp id={id} {...aria} {...props} />}
        {as === 'select' && <Icono nombre="abajo" size={18} className="control-flecha" />}
        {extra && <span className="control-extra">{extra}</span>}
      </div>
      {error ? <p className="field-msg" id={`${id}-err`}>{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  )
}
