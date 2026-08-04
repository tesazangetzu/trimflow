"use client"

import { MapPin } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface LocationDatum {
  name: string
  address?: string
  count: number
  color?: string
}

interface LocationsOverviewProps {
  title: string
  description?: string
  locations: LocationDatum[]
  className?: string
}

const DECORATIVE_POINTS = [
  { x: "18%", y: "30%", size: 10 },
  { x: "42%", y: "62%", size: 14 },
  { x: "63%", y: "24%", size: 8 },
  { x: "78%", y: "55%", size: 12 },
  { x: "30%", y: "78%", size: 8 },
  { x: "55%", y: "82%", size: 10 },
]

export function LocationsOverview({
  title,
  description,
  locations,
  className,
}: LocationsOverviewProps) {
  return (
    <Card className={cn("rounded-xl border bg-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Stylized "map" panel — propio, sin assets del template */}
        <div className="relative h-48 overflow-hidden rounded-lg border border-border bg-muted/40">
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute left-0 top-0 h-px w-24 bg-primary/60" />
          <div className="absolute bottom-0 right-0 h-px w-24 bg-primary/60" />
          {DECORATIVE_POINTS.map((p, i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" style={{ width: p.size, height: p.size }} />
                <span
                  className="relative inline-flex rounded-full bg-primary"
                  style={{ width: p.size, height: p.size }}
                />
              </span>
            </div>
          ))}
          <MapPin className="absolute bottom-3 left-3 size-5 text-muted-foreground/60" />
          <span className="absolute bottom-3 left-10 text-[11px] font-medium text-muted-foreground">
            TrimFlow
          </span>
        </div>

        <ul className="mt-4 space-y-1">
          {locations.map((loc) => (
            <li
              key={loc.name}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{loc.name}</p>
                {loc.address && (
                  <p className="truncate text-xs text-muted-foreground">{loc.address}</p>
                )}
              </div>
              <Badge variant="outline">{loc.count} citas</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
