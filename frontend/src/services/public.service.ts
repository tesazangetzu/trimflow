import publicApi from "@/lib/public-axios"
import type {
  PublicShop,
  PublicAvailability,
  CustomerLookupResult,
  PublicAppointmentPayload,
  AppointmentResult,
} from "@/types/public"

export async function getShop(slug: string): Promise<PublicShop> {
  const { data } = await publicApi.get(`/public/${slug}`)
  return data
}

export async function getAvailability(
  slug: string,
  serviceId: string,
  barberId: string,
  date: string,
  signal?: AbortSignal,
): Promise<PublicAvailability> {
  const { data } = await publicApi.get(`/public/${slug}/availability`, {
    params: { serviceId, barberId, date },
    signal,
  })
  return data
}

export async function lookupCustomer(
  slug: string,
  email: string,
): Promise<CustomerLookupResult> {
  const { data } = await publicApi.post(`/public/${slug}/customers/lookup`, { email })
  return data
}

export async function createAppointment(
  slug: string,
  payload: PublicAppointmentPayload,
): Promise<AppointmentResult> {
  const { data } = await publicApi.post(`/public/${slug}/appointments`, payload)
  return data
}