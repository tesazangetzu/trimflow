"use client"

import { type ReactNode } from "react"
import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { SUPER_ADMIN_NAV } from "@/components/layouts/nav-config"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell menu={SUPER_ADMIN_NAV} roleLabel="Super Admin" brandLabel="SUPER" pageTitle="Panel de Super Admin" pageBreadcrumb="Home / Super Admin / Panel">
      {children}
    </DashboardShell>
  )
}
