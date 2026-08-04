export interface Setting {
  id: string
  key: string
  value: string
  description?: string
  branchId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface SetSettingDto {
  key: string
  value: string
  description?: string
  branchId?: string
}
