"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ChevronDown, List, LogOut, Menu } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { CommandPalette } from "@/components/layouts/command-palette"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { cn } from "@/lib/utils"
import type { NavItem } from "@/components/layouts/nav-config"

const SIDEBAR_KEY = "trimflow:sidebar-collapsed"

interface DashboardShellProps {
  children: ReactNode
  menu: NavItem[]
  roleLabel: string
  brandLabel?: string
  pageTitle?: string
  pageBreadcrumb?: string
}

export function DashboardShell({
  children,
  menu,
  roleLabel,
  brandLabel = "TRIMFLOW",
  pageTitle,
  pageBreadcrumb,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY)
    if (stored !== null) setCollapsed(stored === "1")
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_KEY, prev ? "0" : "1")
      return !prev
    })
  }

  const initials = user?.name?.charAt(0).toUpperCase() || roleLabel.charAt(0).toUpperCase()

  const isActive = (href: string) => pathname.startsWith(href)

  const nav = (isCollapsed: boolean) => (
    <nav className="flex flex-1 flex-col overflow-y-auto px-0 pt-5">
      {(["menu", "others"] as const).map((section) => {
        const items = menu.filter((item) => (item.section ?? "menu") === section)
        if (items.length === 0) return null
        return (
          <div key={section} className="mb-4">
            {!isCollapsed && (
              <span className="mb-2 block px-5 text-[11px] font-medium uppercase tracking-widest text-sidebar-foreground">
                {section === "menu" ? "MENU" : "OTHERS"}
              </span>
            )}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center py-2.5 text-sm transition-colors",
                        isCollapsed ? "justify-center px-0" : "px-5",
                        active
                          ? "border-l-[3px] border-sidebar-primary bg-sidebar-accent font-medium text-white"
                          : "border-l-[3px] border-transparent text-sidebar-foreground hover:border-sidebar-primary hover:bg-sidebar-accent hover:font-medium hover:text-white",
                      )}
                    >
                      <Icon className={cn("size-[18px] shrink-0", active ? "text-white" : "text-sidebar-foreground/60 hover:text-white")} />
                      {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )

  const sidebarContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-sidebar">
      <div
        className={cn(
          "flex h-[74px] shrink-0 items-center gap-3",
          isCollapsed ? "justify-center px-0" : "px-5",
        )}
      >
        <div className="flex size-[28px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary/80 to-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          {brandLabel.charAt(0).toUpperCase()}
        </div>
        {!isCollapsed && (
          <span className="text-[13px] font-bold tracking-wide text-sidebar-primary-foreground">
            {brandLabel}
          </span>
        )}
      </div>
      {nav(isCollapsed)}
      {!isCollapsed && (
        <div className="mt-auto border-t border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-gradient-to-br from-sidebar-primary/80 to-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.name || roleLabel}</p>
              <p className="truncate text-[11px] text-sidebar-foreground">{roleLabel}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="size-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 z-40 shadow-sidebar transition-[width] duration-200 lg:block",
          collapsed ? "w-[80px]" : "w-[264px]",
        )}
      >
        <div className="sticky top-0 h-screen">{sidebarContent(collapsed)}</div>
      </aside>

      {/* Mobile sheet */}
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-3 top-3 z-50 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-[264px] bg-sidebar p-0">
          {sidebarContent(false)}
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[74px] items-center bg-background/70 px-4 [backdrop-filter:blur(7px)] sm:px-6">
          <div className="me-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="hidden size-11 cursor-pointer rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
              aria-label={collapsed ? "Abrir barra lateral" : "Colapsar barra lateral"}
            >
              {collapsed ? <Menu className="size-5" /> : <List className="size-5" />}
            </Button>

            {/* Search (command palette) */}
            <CommandPalette menu={menu} />
          </div>

          <div className="flex flex-1 items-center justify-end gap-1">
            <ModeToggle />

            {/* Bell with badge */}
            <button
              className="relative flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Notificaciones"
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-1.5 top-1.5 rounded-full bg-success px-1 text-[10px] font-semibold leading-4 text-success-foreground">
                2
              </span>
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex cursor-pointer items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-[11px] font-bold text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <p className="text-xs font-medium leading-[18px] text-foreground">{user?.name}</p>
                      <p className="text-[10px] leading-[14px] text-muted-foreground">{roleLabel}</p>
                    </div>
                    <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-sm font-bold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wider">
                      {roleLabel}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <DropdownMenuItem onClick={logout} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="size-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {pageTitle && (
            <div className="mb-6">
              <h5 className="mb-0 text-base font-semibold text-foreground">{pageTitle}</h5>
              {pageBreadcrumb && (
                <p className="mt-1 text-sm text-muted-foreground/50">{pageBreadcrumb}</p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
