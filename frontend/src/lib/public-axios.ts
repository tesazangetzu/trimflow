import axios from "axios"

/** Cliente axios para endpoints públicos de la landing (sin JWT / refresh).
 *  Base URL bajo /v1. Mantiene el interceptor que desenvuelve la respuesta del
 *  TransformInterceptor de NestJS: { statusCode, message, data } → data.
 */
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1",
  headers: { "Content-Type": "application/json" },
})

publicApi.interceptors.response.use((response) => {
  if (response.data && typeof response.data === "object" && "data" in response.data) {
    response.data = response.data.data
  }
  return response
})

export default publicApi