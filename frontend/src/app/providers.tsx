"use client"

import { type ReactNode } from "react"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toast"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <Toaster>{children}</Toaster>
      </AuthProvider>
    </ThemeProvider>
  )
}
