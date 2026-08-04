import api from "@/lib/axios"
import type { LoginDto, RegisterDto, AuthResponse, User } from "@/types/auth"

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const { data } = await api.post("/auth/login", dto)
  return data
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const { data } = await api.post("/auth/register", dto)
  return data
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await api.post("/auth/refresh", { refreshToken })
  return data
}

export async function me(): Promise<User> {
  const { data } = await api.get("/auth/me")
  return data
}
