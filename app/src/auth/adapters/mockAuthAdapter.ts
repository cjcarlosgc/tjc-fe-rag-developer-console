import type { AuthAdapter, AuthSession } from '../types'

const STORAGE_KEY = 'rag-console.mock-session'
/** HU62: única identidad demostrativa, siempre de GitHub y ficticia, nunca el correo real de quien usa la demo. */
const DEMO_GITHUB_USER = { id: 'user_demo_github', email: 'demo@rag-test-studio.local' }
const DEMO_GITHUB_TOKEN = 'mock-github-session-token'
/** HU30: provider token GitHub demo, nunca real — separado del `accessToken` de la sesión de la Console. */
const DEMO_GITHUB_PROVIDER_TOKEN = 'mock-github-provider-token'
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
  /** El mock no redirige a GitHub: establece la sesión demo de inmediato y la navegación posterior la hace `LoginPage`. */
  async signInWithGitHub() {
    await latency()
    const session: AuthSession = { user: DEMO_GITHUB_USER, accessToken: DEMO_GITHUB_TOKEN, githubProviderToken: DEMO_GITHUB_PROVIDER_TOKEN }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return session
  },
  async signOut() {
    await latency()
    localStorage.removeItem(STORAGE_KEY)
  },
  onAuthStateChange() {
    return () => {}
  },
}
