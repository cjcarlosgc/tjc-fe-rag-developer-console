import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { isMockAuth } from './authMode'
import { authErrorMessage } from './errors'
import { safeReturnTo } from './returnTo'
import { useAuth } from './useAuth'

/** HU62 (DEC-ORG-001): GitHub es el único método de acceso; no hay correo, contraseña, recuperación ni solicitud de acceso. */
export function LoginPage() {
  const { signInWithGitHub, oauthError, sessionNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const identityNoticeRef = useRef<HTMLDivElement>(null)

  // Volver con Atrás desde GitHub restaura la página desde bfcache con el estado congelado: sin esto «Conectando…» quedaría para siempre.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) setPending(false) }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  /** Destino tras el login: `?returnTo=` (sobrevive una recarga), luego `state.from` y por último la raíz. */
  function returnPath() {
    const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from
    return safeReturnTo(searchParams.get('returnTo')) ?? safeReturnTo(from ? `${from.pathname}${from.search}` : null) ?? '/'
  }

  async function submit() {
    setPending(true)
    setError(null)
    const destination = returnPath()
    try {
      // `redirectTo` de OAuth lleva el destino; en mock no hay redirección y se navega aquí.
      const signedIn = await signInWithGitHub(destination)
      // Sin sesión inmediata el navegador ya está yendo a GitHub: el botón queda deshabilitado hasta salir de la página.
      if (!signedIn) return
      navigate(destination, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    }
    setPending(false)
  }

  // `identity-unavailable` no cierra sesión y se muestra en el shell, no aquí.
  const notice = sessionNotice && sessionNotice.kind !== 'identity-unavailable' ? sessionNotice : null
  const identityRequired = notice?.kind === 'identity-required'
  // El aviso terminal explica por qué se llegó aquí: recibe el foco al montarse para que lectores de pantalla y teclado lo encuentren primero.
  useEffect(() => {
    if (identityRequired) identityNoticeRef.current?.focus()
  }, [identityRequired])
  const failure = error ?? oauthError

  return <section className="auth-page">
    <div className="panel auth-panel">
      <p className="eyebrow">RAG Developer Console</p>
      {isMockAuth() && <span className="environment environment-demo"><i aria-hidden="true" />DEMO · IDENTIDAD SIMULADA</span>}
      <h1>Iniciar sesión</h1>
      <p className="empty-inline-note">El acceso a la Console es solo con tu cuenta de GitHub.</p>
      <div className="auth-form">
        {notice?.kind === 'identity-required' && <div ref={identityNoticeRef} tabIndex={-1} className="feedback error-state" role="alert">
          <strong>Esta cuenta no puede entrar todavía</strong>
          <p>{notice.message}</p>
        </div>}
        {notice?.kind === 'expired' && <div className="feedback" role="status"><p>{notice.message}</p></div>}
        {failure && <div role="alert">
          <p className="inline-error">{failure}</p>
          <button type="button" className="button secondary" disabled={pending} onClick={() => void submit()}>Reintentar</button>
        </div>}
        <button type="button" className="button primary auth-github-button" disabled={pending} onClick={() => void submit()}>
          {pending ? 'Conectando…' : 'Continuar con GitHub'}
        </button>
      </div>
    </div>
  </section>
}
