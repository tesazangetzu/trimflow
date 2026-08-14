"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

const THEME_ORDER = ["light", "dark", "system"] as const

type ThemeMode = (typeof THEME_ORDER)[number]

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const current: ThemeMode = THEME_ORDER.includes(theme as ThemeMode)
    ? (theme as ThemeMode)
    : "system"

  const cycle = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length]
    setTheme(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      className="cursor-pointer text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={`Cambiar tema (actual: ${current})`}
    >
      {current === "light" && <Sun className="size-[18px]" />}
      {current === "dark" && <Moon className="size-[18px]" />}
      {current === "system" && <Monitor className="size-[18px]" />}
    </Button>
  )
}