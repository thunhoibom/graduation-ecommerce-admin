import { authServiceInstance } from './_service-instance'

export interface UserInfo {
  username: string
  email: string
  roles: string[]
}

export interface LoginResponse {
  accessToken: string
  user?: UserInfo
}

interface BackendLoginResponse {
  token: string
}

export interface TokenRefreshResponse {
  accessToken: string
}

const AUTH_KEY = 'accessToken'
const USER_KEY = 'user'

export const authService = {
  /**
   * Login → POST /api/public/auth/login
   * Backend returns { token: "..." } with the JWT in the response body.
   * The auth filter in the backend also sets token as HttpOnly cookie.
   */
  async login(request: { name: string; password: string }): Promise<LoginResponse> {
    // Backend trả raw string "Bearer <token>" — không phải JSON
    const raw = await authServiceInstance.post<string>('/login', request)
    const accessToken = raw.replace(/^Bearer\s+/i, '')
    if (accessToken) {
      localStorage.setItem(AUTH_KEY, accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify({ username: request.name }))
    }

    return { accessToken, user: { username: request.name, email: '', roles: [] } }
  },

  /**
   * Logout → POST /api/v1/auth/logout (if exists) or just clear session.
   * NOTE: Backend has no logout/refresh endpoint (JWT bearer-only).
   */
  async logout(): Promise<void> {
    try {
      await authServiceInstance.post('/logout', {})
    } catch {
      // ignore errors on logout
    } finally {
      this.clearSession()
      window.location.href = '/login'
    }
  },

  clearSession(): void {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getAccessToken(): string | null {
    return localStorage.getItem(AUTH_KEY)
  },

  getUserInfo(): UserInfo | null {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  },
}
