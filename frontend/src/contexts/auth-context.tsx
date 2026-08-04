"use client"

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types/auth"
import * as authService from "@/services/auth.service"
import { getToken, setTokens, clearAll, setTokenCookie, deleteTokenCookie } from "@/lib/auth-storage"

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, tenantId?: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const userData = await authService.me()
        setUser(userData)
      } catch {
        clearAll()
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password })
    setTokens(res.accessToken, res.refreshToken)
    setTokenCookie(res.accessToken)
    const userData = await authService.me()
    setUser(userData)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, tenantId?: string) => {
      const res = await authService.register({ name, email, password, tenantId })
      setTokens(res.accessToken, res.refreshToken)
      setTokenCookie(res.accessToken)
      const userData = await authService.me()
      setUser(userData)
    },
    []
  )

  const logout = useCallback(() => {
    clearAll()
    deleteTokenCookie()
    setUser(null)
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
