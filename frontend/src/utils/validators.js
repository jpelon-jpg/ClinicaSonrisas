// Mismas reglas que el backend (Bean Validation en los DTOs).
export const reglasPassword = [
  { id: 'len', texto: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { id: 'may', texto: 'Una letra mayúscula', test: (v) => /[A-Z]/.test(v) },
  { id: 'num', texto: 'Un número', test: (v) => /\d/.test(v) },
  { id: 'esp', texto: 'Un carácter especial (#, $, !, …)', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export const v = {
  requerido: (msg = 'Este campo es obligatorio') => (x) => (x === undefined || x === null || String(x).trim() === '' ? msg : null),
  email: () => (x) => (!x || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x) ? null : 'Escribe un correo válido, por ejemplo nombre@correo.com'),
  password: () => (x) => {
    if (!x) return null
    const falla = reglasPassword.find((r) => !r.test(x))
    return falla ? `La contraseña necesita: ${falla.texto.toLowerCase()}` : null
  },
  telefono: () => (x) => (!x || /^\+?\d{10,15}$/.test(x) ? null : 'El teléfono debe tener 10 dígitos (solo números)'),
  nombre: () => (x) => (!x || /^[\p{L} .'-]+$/u.test(x) ? null : 'Solo letras y espacios'),
  max: (n) => (x) => (!x || String(x).length <= n ? null : `Máximo ${n} caracteres`),
  min: (n) => (x) => (!x || String(x).trim().length >= n ? null : `Mínimo ${n} caracteres`),
  entre: (a, b, msg) => (x) => (x === '' || x === null || x === undefined || (Number(x) >= a && Number(x) <= b) ? null : msg || `Debe estar entre ${a} y ${b}`),
  igual: (otro, msg) => (x, valores) => (x === valores[otro] ? null : msg),
  futura: () => (x) => (!x || new Date(x) > new Date() ? null : 'Elige una fecha y hora futura'),
  pasada: () => (x) => (!x || new Date(x) < new Date() ? null : 'La fecha debe ser anterior a hoy'),
  cedula: () => (x) => (!x || /^\d{7,8}$/.test(x) ? null : 'La cédula tiene 7 u 8 dígitos'),
}
