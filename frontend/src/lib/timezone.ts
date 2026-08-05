// Zona horaria de la barbería: Lima, Perú (UTC-5, sin horario de verano).
// Perú abolió el DST en 1994, por lo que el offset es constante.
export const SHOP_TIMEZONE_OFFSET = "-05:00"

// Interpreta una fecha local de la barbería ("YYYY-MM-DD") y una hora ("HH:mm")
// como hora de Lima y devuelve un Date en UTC (correcto para enviar al backend).
export function toShopDate(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${time}:00${SHOP_TIMEZONE_OFFSET}`)
}

// Convierte una fecha local de la barbería a ISO (UTC) para el payload de la cita.
export function toShopISO(dateStr: string, time: string): string {
  return toShopDate(dateStr, time).toISOString()
}

// Fecha de HOY en la zona de Lima como "YYYY-MM-DD" (independiente del navegador).
export function todayInShop(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  return parts.replaceAll("/", "-")
}

// Suma días a una fecha "YYYY-MM-DD" (evita bugs de zona horaria al construir Date).
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}