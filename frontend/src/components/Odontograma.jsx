/**
 * Odontograma con numeración FDI (adulto: 18–11 | 21–28 / 48–41 | 31–38).
 * registros = estado actual por pieza  ·  onSeleccionar(pieza) abre el detalle.
 */
export const COLORES_PIEZA = {
  SANA: { fondo: '#FFFFFF', borde: '#CBD5E1', texto: 'Sana' },
  CARIES: { fondo: '#FEE2E2', borde: '#DC2626', texto: 'Caries' },
  RESINA: { fondo: '#DBEAFE', borde: '#2563EB', texto: 'Resina' },
  AMALGAMA: { fondo: '#E2E8F0', borde: '#475569', texto: 'Amalgama' },
  CORONA: { fondo: '#FEF3C7', borde: '#D97706', texto: 'Corona' },
  ENDODONCIA: { fondo: '#EDE9FE', borde: '#7C3AED', texto: 'Endodoncia' },
  AUSENTE: { fondo: '#F1F5F9', borde: '#94A3B8', texto: 'Ausente' },
  POR_EXTRAER: { fondo: '#FFE4E6', borde: '#BE123C', texto: 'Por extraer' },
  IMPLANTE: { fondo: '#CCFBF1', borde: '#0F766E', texto: 'Implante' },
}

const SUP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const INF = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

export default function Odontograma({ registros = [], seleccionada, onSeleccionar }) {
  const porPieza = Object.fromEntries(registros.map((r) => [r.pieza, r]))
  const pieza = (n) => {
    const r = porPieza[n]
    const c = COLORES_PIEZA[r?.estado || 'SANA']
    return (
      <button key={n} type="button" className={`pieza ${seleccionada === n ? 'sel' : ''} ${r?.estado === 'AUSENTE' ? 'ausente' : ''}`}
        style={{ background: c.fondo, borderColor: c.borde }} onClick={() => onSeleccionar?.(n)}
        title={`Pieza ${n}: ${c.texto}`} aria-label={`Pieza ${n}, ${c.texto}`}>
        <span>{n}</span>
      </button>
    )
  }
  return (
    <div className="odontograma">
      <div className="arcada">{SUP.map(pieza)}</div>
      <div className="arcada">{INF.map(pieza)}</div>
      <ul className="leyenda">
        {Object.entries(COLORES_PIEZA).map(([k, c]) => (
          <li key={k}><span style={{ background: c.fondo, borderColor: c.borde }} />{c.texto}</li>
        ))}
      </ul>
    </div>
  )
}
