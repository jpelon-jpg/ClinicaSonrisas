// Cliente HTTP basado en fetch. Agrega el JWT en el header Authorization
// y convierte cualquier error (red, 4xx, 5xx) en un ApiError uniforme.
const BASE = (import.meta.env.VITE_API_URL || '') + '/api'
const TOKEN_KEY = 'sonrisa.token'

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

function query(params) {
  if (!params) return ''
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, v)
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

async function request(method, path, { body, params } = {}) {
  const headers = { Accept: 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(BASE + path + query(params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && token) {
      // token vencido o revocado: se avisa a AuthContext para cerrar sesión
      window.dispatchEvent(new Event('sonrisa:sesion-expirada'))
    }
    const msg = data?.message || mensajesPorEstado[res.status] || 'Ocurrió un error inesperado'
    throw new ApiError(res.status, msg, data?.fieldErrors || {})
  }
  return data
}

const mensajesPorEstado = {
  400: 'Revisa los datos del formulario',
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para realizar esta acción',
  404: 'El recurso no existe',
  422: 'La operación no cumple las reglas del negocio',
  500: 'Error interno del servidor',
}

export const api = {
  get: (p, params) => request('GET', p, { params }),
  post: (p, body) => request('POST', p, { body }),
  put: (p, body) => request('PUT', p, { body }),
  patch: (p, body) => request('PATCH', p, { body }),
  del: (p) => request('DELETE', p),
}
