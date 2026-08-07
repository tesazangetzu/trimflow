import api from "@/lib/axios"
import type { LandingConfig } from "@/types/landing"

export interface LandingConfigResponse {
  slug: string
  config: LandingConfig
}

export async function getConfig(): Promise<LandingConfigResponse> {
  const { data } = await api.get("/landing")
  return data
}

export async function updateConfig(dto: Partial<LandingConfig>): Promise<LandingConfig> {
  const { data } = await api.put("/landing", dto)
  return data
}