/** Campo de formulario con etiqueta y mensaje de error debajo del input. */
export default function Field({ label, error, as = 'input', hint, children, className = '', ...props }) {
  const id = props.id || `f-${props.name}`
  const Comp = as
  return (
    <div className={`field ${error ? 'field-error' : ''} ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {as === 'select' ? (
        <select id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props}>{children}</select>
      ) : (
        <Comp id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      )}
      {error ? <p className="field-msg" id={`${id}-err`}>{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  )
}
