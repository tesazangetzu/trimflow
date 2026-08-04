export type UserRole = "super-admin" | "admin" | "barber"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId?: string
  barberId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  password: string
  tenantId?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
}
