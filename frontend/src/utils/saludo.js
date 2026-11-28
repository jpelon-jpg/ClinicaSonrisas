/** "Buenos días / Buenas tardes / Buenas noches" según la hora local. */
export function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/** "Miércoles 4 de noviembre de 2026" */
export function fechaHoyLarga() {
  const s = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
