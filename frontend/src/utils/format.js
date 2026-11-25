const tz = { timeZone: 'America/Mexico_City' }

export const fecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
export const hora = (iso) => iso ? new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'
export const fechaHora = (iso) => iso ? `${fecha(iso)} · ${hora(iso)}` : '—'
export const fechaLarga = (iso) => iso ? new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'
export const dinero = (n) => (n ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
export const hoyISO = () => new Date().toLocaleDateString('en-CA', tz)
export const iniciales = (nombre = '') => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export const ESTADOS_CITA = {
  PENDIENTE: { texto: 'Pendiente', clase: 'warn' },
  CONFIRMADA: { texto: 'Confirmada', clase: 'ok' },
  ATENDIDA: { texto: 'Atendida', clase: 'info' },
  CANCELADA: { texto: 'Cancelada', clase: 'muted' },
  NO_ASISTIO: { texto: 'No asistió', clase: 'danger' },
  RECHAZADA: { texto: 'Rechazada', clase: 'danger' },
}

export const ACCESOS = {
  CORREO: 'Correo y contraseña',
  GOOGLE: 'Google',
  FACEBOOK: 'Facebook',
  SIN_ACCESO: 'Sin acceso',
}
