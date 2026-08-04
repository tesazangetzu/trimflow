"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { NavItem } from "@/components/layouts/nav-config"

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function CommandPalette({ menu }: { menu: NavItem[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const openPalette = () => {
    setQuery("")
    setActiveIndex(0)
    openRef.current = true
    setOpen(true)
  }

  const closePalette = () => {
    openRef.current = false
    setOpen(false)
  }

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return menu
    return menu.filter((item) => normalize(item.label).includes(q))
  }, [menu, query])

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        if (openRef.current) closePalette()
        else openPalette()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const navigate = (item: NavItem) => {
    router.push(item.href)
    closePalette()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const item = results[activeIndex]
      if (item) navigate(item)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        openRef.current = next
        setOpen(next)
      }}
    >
      <Button
        variant="outline"
        onClick={openPalette}
        className="ml-1 hidden h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-normal text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
        aria-label="Buscar..."
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={openPalette}
        className="hidden size-11 cursor-pointer rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        aria-label="Buscar..."
      >
        <Search className="size-5" />
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>
            Busca páginas, acciones y accesos rápidos.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar páginas..."
            className="pl-9"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((item, index) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors",
                        index === activeIndex
                          ? "bg-accent"
                          : "hover:bg-accent",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}