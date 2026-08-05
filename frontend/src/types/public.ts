export interface PublicBarber {
  id: string
  name: string
}

export interface PublicService {
  id: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
}

export interface PublicBranch {
  id: string
  name: string
  address: string | null
  phone: string | null
  openingTime: string | null
  closingTime: string | null
  barbers: PublicBarber[]
  services: PublicService[]
}

export interface PublicShop {
  slug: string
  name: string
  email: string | null
  branches: PublicBranch[]
}

export interface PublicSlot {
  startTime: string
  past: boolean
}

export interface PublicAvailability {
  date: string
  serviceId: string
  barberId: string | null
  durationMinutes: number
  slots?: PublicSlot[]
  barbers?: Array<{ barberId: string; slots: PublicSlot[] }>
}

export interface CustomerLookupResult {
  name: string
  email: string
  phone: string | null
  notes: string | null
}

export interface PublicAppointmentPayload {
  serviceId: string
  barberId: string
  startTime: string
  name: string
  email: string
  phone?: string
  notes?: string
}

export interface AppointmentResult {
  id: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  barberId: string
  customerId: string
  serviceId: string
  createdAt: string
  updatedAt: string
}
