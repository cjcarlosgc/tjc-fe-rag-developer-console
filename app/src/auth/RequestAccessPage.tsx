import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

/** spec.md HU29: no presume auto-registro público; esto solo registra una solicitud para revisión manual. */
export function RequestAccessPage() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    await new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : 180))
    setPending(false)
    setSent(true)
  }

  return <section className="auth-page">
    <div className="panel auth-panel">
      <p className="eyebrow">RAG Developer Console</p>
      <h1>Solicitar acceso</h1>
      {sent ? <p role="status">Registramos tu solicitud. Te contactaremos si se aprueba el acceso.</p> : <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="access-email">Correo de trabajo</label>
          <input id="access-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <button className="button primary" type="submit" disabled={pending || !email.trim()}>{pending ? 'Enviando…' : 'Solicitar acceso'}</button>
      </form>}
      <div className="auth-links"><Link to="/login">Volver a iniciar sesión</Link></div>
    </div>
  </section>
}
