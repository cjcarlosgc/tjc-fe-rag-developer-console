import { invalidCredentialsMessage } from '../errors'
import type { AuthAdapter, AuthSession } from '../types'

const STORAGE_KEY = 'rag-console.mock-session'
/** Decisión: identidad demostrativa ficticia, nunca el correo real de quien usa la demo. */
const DEMO_USER = { id: 'user_demo_local', email: 'demo@rag-test-studio.local' }
const DEMO_TOKEN = 'mock-session-token'
const latency = () => new Promise<void>((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : 180))

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

export const mockAuthAdapter: AuthAdapter = {
  async getSession() {
    return readStoredSession()
  },
  async signInWithPassword(email, password) {
    await latency()
    if (!email.trim() || password.length < 6) throw new Error(invalidCredentialsMessage)
    const session: AuthSession = { user: DEMO_USER, accessToken: DEMO_TOKEN }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return session
  },
  async signOut() {
    await latency()
    localStorage.removeItem(STORAGE_KEY)
  },
  async resetPasswordForEmail() {
    await latency()
  },
  onAuthStateChange() {
    return () => {}
  },
}
