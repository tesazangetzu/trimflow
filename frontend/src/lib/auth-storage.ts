const TOKEN_KEY = "accessToken"
const REFRESH_KEY = "refreshToken"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function clearAll(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function setTokenCookie(accessToken: string): void {
  document.cookie = `accessToken=${accessToken};path=/;max-age=604800;SameSite=Lax`
}

export function deleteTokenCookie(): void {
  document.cookie = "accessToken=;path=/;max-age=0"
}
