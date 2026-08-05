"use client"

import type { ReactNode } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  sparkline?: number[]
  color?: string
  icon?: ReactNode
  className?: string
}

export function KpiCard({
  label,
  value,
  trend,
  trendLabel = "vs. anterior",
  sparkline = [],
  color = "var(--chart-1)",
  icon,
  className,
}: KpiCardProps) {
  const positive = (trend ?? 0) >= 0
  const data = sparkline.map((v, i) => ({ i, v }))

  return (
    <Card className={cn("rounded-xl border bg-card", className)}>
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
          {icon && <div className="flex size-8 items-center justify-center rounded-lg bg-muted">{icon}</div>}
        </div>

        <div className="flex flex-1 items-end justify-between gap-3">
          <div className="min-w-0 self-start">
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            {trend !== undefined && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                  )}
                >
                  {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {Math.abs(trend).toFixed(1)}%
                </span>
                {trendLabel}
              </p>
            )}
          </div>
          {data.length > 1 && (
            <div className="h-12 w-28 shrink-0 self-end">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#spark-${label})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
