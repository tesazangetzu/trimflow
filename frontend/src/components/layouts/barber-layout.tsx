"use client"

import { type ReactNode } from "react"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { BARBER_NAV } from "@/components/layouts/nav-config"

export default function BarberLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell menu={BARBER_NAV} roleLabel="Barber" brandLabel="TRIMFLOW" pageTitle="Mi Agenda" pageBreadcrumb="Home / Barber / Agenda">
      {children}
    </DashboardShell>
  )
}
