import api from "@/lib/axios"
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from "@/types/customer"

export async function getAll(branchId?: string): Promise<Customer[]> {
  const params = branchId ? { branchId } : {}
  const { data } = await api.get("/customers", { params })
  return data
}

export async function getById(id: string): Promise<Customer> {
  const { data } = await api.get(`/customers/${id}`)
  return data
}

export async function create(dto: CreateCustomerDto): Promise<Customer> {
  const { data } = await api.post("/customers", dto)
  return data
}

export async function update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
  const { data } = await api.patch(`/customers/${id}`, dto)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/customers/${id}`)
}
