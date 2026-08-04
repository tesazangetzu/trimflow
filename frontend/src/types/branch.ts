export interface Branch {
  id: string
  name: string
  address?: string
  phone?: string
  openingTime?: string
  closingTime?: string
  tenantId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateBranchDto {
  name: string
  tenantId: string
  address?: string
  phone?: string
  openingTime?: string
  closingTime?: string
}

export interface UpdateBranchDto {
  name?: string
  address?: string
  phone?: string
  openingTime?: string
  closingTime?: string
}
