export interface Service {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  branchId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateServiceDto {
  name: string
  price: number
  durationMinutes: number
  branchId: string
  description?: string
}

export interface UpdateServiceDto {
  name?: string
  price?: number
  durationMinutes?: number
  description?: string
}
