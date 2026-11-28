import Icono from './Icono'

/** Campo de búsqueda con lupa (filtro que se envía al servidor). */
export function Buscar({ value, onChange, placeholder = 'Buscar…', ancho }) {
  return (
    <div className={`control con-icono ${ancho ? '' : 'crece-2'}`}>
      <Icono nombre="buscar" size={18} className="control-ico" />
      <input className="input" placeholder={placeholder} value={value} onChange={onChange} aria-label={placeholder} />
    </div>
  )
}

/** Lista desplegable con ícono para filtros. */
export function Seleccion({ icono, value, onChange, etiqueta, children }) {
  return (
    <div className={`control es-select ${icono ? 'con-icono' : ''}`}>
      {icono && <Icono nombre={icono} size={18} className="control-ico" />}
      <select className="input" value={value} onChange={onChange} aria-label={etiqueta}>{children}</select>
      <Icono nombre="abajo" size={18} className="control-flecha" />
    </div>
  )
}
