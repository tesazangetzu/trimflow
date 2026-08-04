export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  branchId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateCustomerDto {
  name: string
  branchId: string
  email?: string
  phone?: string
  notes?: string
}

export interface UpdateCustomerDto {
  name?: string
  email?: string
  phone?: string
  notes?: string
}
