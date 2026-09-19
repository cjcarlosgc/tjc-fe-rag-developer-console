import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequestPasswordResetPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      await requestPasswordReset(email)
    } catch {
      // spec.md HU29: la respuesta nunca revela si la cuenta existe, incluso ante un error de transporte.
    } finally {
      setPending(false)
      setSent(true)
    }
  }

  return <section className="auth-page">
    <div className="panel auth-panel">
      <p className="eyebrow">RAG Developer Console</p>
      <h1>Recuperar contraseña</h1>
      {sent ? <p role="status">Si el correo corresponde a una cuenta, enviamos instrucciones para restablecer la contraseña.</p> : <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="reset-email">Correo</label>
          <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <button className="button primary" type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Enviar instrucciones'}</button>
      </form>}
      <div className="auth-links"><Link to="/login">Volver a iniciar sesión</Link></div>
    </div>
  </section>
}
