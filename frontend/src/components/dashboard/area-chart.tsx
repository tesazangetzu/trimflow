"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCurrency, type DayPoint } from "@/components/dashboard/chart-tools"

interface AreaChartProps {
  title: string
  description?: string
  series: DayPoint[]
  dataKey?: "count" | "revenue"
  color?: string
  className?: string
}

const RANGES = [
  { key: "7d", label: "7d", days: 7 },
  { key: "30d", label: "30d", days: 30 },
] as const

function ChartTooltip({
  active,
  payload,
  label,
  dataKey,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  dataKey: "count" | "revenue"
}) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0].value
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {dataKey === "revenue" ? formatCurrency(value) : `${value} citas`}
      </p>
    </div>
  )
}

export function DashboardAreaChart({
  title,
  description,
  series,
  dataKey = "count",
  color = "var(--chart-1)",
  className,
}: AreaChartProps) {
  const [range, setRange] = useState<(typeof RANGES)[number]["days"]>(7)

  const data = series.slice(-range)

  return (
    <Card className={cn("rounded-xl border bg-card", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant="ghost"
              onClick={() => setRange(r.days)}
              className={cn(
                "h-7 px-2.5 text-xs",
                range === r.days && "bg-card font-medium shadow-sm",
              )}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="main-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                content={<ChartTooltip dataKey={dataKey} />}
                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill="url(#main-area)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
