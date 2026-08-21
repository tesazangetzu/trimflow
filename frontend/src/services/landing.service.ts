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

export interface BrandingUploadResponse {
  url: string
  key: string
  config: LandingConfig
}

export async function uploadBrandingImage(
  target: "logo" | "hero",
  file: File,
): Promise<BrandingUploadResponse> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post(`/landing/branding/upload?target=${target}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}