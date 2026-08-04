import {
  Ban,
  Building2,
  CalendarCheck,
  CalendarDays,
  Clock,
  LayoutDashboard,
  Scissors,
  Store,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  section?: "menu" | "others"
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "menu" },
  { href: "/admin/branches", label: "Sucursales", icon: Store, section: "menu" },
  { href: "/admin/barbers", label: "Barbers", icon: UserCog, section: "menu" },
  { href: "/admin/services", label: "Servicios", icon: Scissors, section: "menu" },
  { href: "/admin/schedules", label: "Horarios", icon: CalendarDays, section: "menu" },
  { href: "/admin/customers", label: "Clientes", icon: Users, section: "menu" },
  { href: "/admin/appointments", label: "Citas", icon: CalendarCheck, section: "others" },
]

export const BARBER_NAV: NavItem[] = [
  { href: "/barber/dashboard", label: "Agenda", icon: LayoutDashboard, section: "menu" },
  { href: "/barber/schedule", label: "Horario Semanal", icon: Clock, section: "menu" },
  { href: "/barber/schedule/blocks", label: "Bloquear Slots", icon: Ban, section: "menu" },
]

export const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "menu" },
  { href: "/super-admin/tenants", label: "Tenants", icon: Building2, section: "menu" },
]
