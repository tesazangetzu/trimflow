import api from "@/lib/axios"
import type { Setting, SetSettingDto } from "@/types/setting"

export async function getAll(branchId?: string): Promise<Setting[]> {
  const params = branchId ? { branchId } : {}
  const { data } = await api.get("/settings", { params })
  return data
}

export async function getByKey(key: string, branchId?: string): Promise<Setting> {
  const params = branchId ? { branchId } : {}
  const { data } = await api.get(`/settings/${key}`, { params })
  return data
}

export async function set(dto: SetSettingDto): Promise<Setting> {
  const { data } = await api.post("/settings", dto)
  return data
}

export async function remove(key: string, branchId?: string): Promise<void> {
  const params = branchId ? { branchId } : {}
  await api.delete(`/settings/${key}`, { params })
}
