import { useEffect, useRef, useState } from 'react'

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const FB_ID = import.meta.env.VITE_FACEBOOK_APP_ID

function cargarScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve()
    const s = document.createElement('script')
    s.src = src; s.id = id; s.async = true; s.defer = true
    s.onload = resolve
    s.onerror = () => reject(new Error('No se pudo cargar ' + src))
    document.body.appendChild(s)
  })
}

/** Botones "Continuar con Google" (Google Identity Services) y "Continuar con Facebook" (SDK JS). */
export default function SocialButtons({ onGoogle, onFacebook, deshabilitado }) {
  const googleRef = useRef(null)
  const [fbListo, setFbListo] = useState(false)
  const [errorCarga, setErrorCarga] = useState(null)

  useEffect(() => {
    if (!GOOGLE_ID) return
    cargarScript('https://accounts.google.com/gsi/client', 'gsi')
      .then(() => {
        window.google.accounts.id.initialize({ client_id: GOOGLE_ID, callback: (r) => onGoogle(r.credential) })
        window.google.accounts.id.renderButton(googleRef.current, {
          theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 220, locale: 'es',
        })
      })
      .catch(() => setErrorCarga('No se pudo cargar el inicio de sesión de Google'))
  }, [onGoogle])

  useEffect(() => {
    if (!FB_ID) return
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FB_ID, cookie: false, xfbml: false, version: 'v19.0' })
      setFbListo(true)
    }
    cargarScript('https://connect.facebook.net/es_LA/sdk.js', 'facebook-jssdk')
      .then(() => window.FB && setFbListo(true))
      .catch(() => setErrorCarga('No se pudo cargar el inicio de sesión de Facebook'))
  }, [])

  const facebook = () => {
    window.FB.login((resp) => {
      if (resp.authResponse) onFacebook(resp.authResponse.accessToken)
    }, { scope: 'email,public_profile' })
  }

  return (
    <div className="social">
      {GOOGLE_ID
        ? <div ref={googleRef} className="google-btn" aria-label="Continuar con Google" />
        : <button type="button" className="btn btn-social" disabled title="Configura VITE_GOOGLE_CLIENT_ID">
            <GoogleIcon /> Google</button>}
      <button type="button" className="btn btn-social btn-fb" onClick={facebook} disabled={!fbListo || deshabilitado}
        title={FB_ID ? undefined : 'Configura VITE_FACEBOOK_APP_ID'}>
        <FacebookIcon /> Facebook
      </button>
      {errorCarga && <p className="field-msg" style={{ gridColumn: '1 / -1' }}>{errorCarga}</p>}
    </div>
  )
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
)
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#fff" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
)
