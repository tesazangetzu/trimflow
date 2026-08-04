"use client"

import { type ReactNode } from "react"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { ADMIN_NAV } from "@/components/layouts/nav-config"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell menu={ADMIN_NAV} roleLabel="Admin" brandLabel="TRIMFLOW" pageTitle="Panel de Administración" pageBreadcrumb="Home / Admin / Panel">
      {children}
    </DashboardShell>
  )
}
