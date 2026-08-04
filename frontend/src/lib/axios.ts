import axios from "axios"
import { getToken, clearAll, setTokens } from "./auth-storage"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Desenvuelve la respuesta del TransformInterceptor de NestJS:
 *  { statusCode, message, data: actualData, requestId, timestamp } → actualData */
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      response.data = response.data.data
    }
    return response
  },
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) throw new Error("No refresh token")

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        )

        setTokens(data.data.accessToken, data.data.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch {
        clearAll()
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
