import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authErrorMessage } from './errors'
import { useAuth } from './useAuth'

/** Evita open-redirect: solo se acepta una ruta interna como destino tras el login. */
function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

export function LoginPage() {
  const { signIn, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [githubPending, setGithubPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function navigateAfterLogin() {
    const returnTo = safeReturnTo(searchParams.get('returnTo'))
    const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from
    navigate(returnTo ?? (from ? `${from.pathname}${from.search}` : '/'), { replace: true })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signIn(email, password)
      navigateAfterLogin()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  async function submitWithGitHub() {
    setGithubPending(true)
    setError(null)
    try {
      await signInWithGitHub()
      navigateAfterLogin()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setGithubPending(false)
    }
  }

  return <section className="auth-page">
    <div className="panel auth-panel">
      <p className="eyebrow">RAG Developer Console</p>
      <h1>Iniciar sesión</h1>
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="login-email">Correo</label>
          <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button className="button primary" type="submit" disabled={pending}>{pending ? 'Verificando…' : 'Iniciar sesión'}</button>
      </form>
      <div className="auth-divider" role="separator"><span>o</span></div>
      <button type="button" className="button secondary auth-github-button" disabled={githubPending} onClick={() => void submitWithGitHub()}>
        {githubPending ? 'Conectando…' : 'Continuar con GitHub'}
      </button>
      <div className="auth-links">
        <Link to="/reset-password">¿Olvidaste tu contraseña?</Link>
        <Link to="/request-access">Solicitar acceso</Link>
      </div>
    </div>
  </section>
}
