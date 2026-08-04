"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface DonutDatum {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  title: string
  description?: string
  data: DonutDatum[]
  className?: string
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value: number }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <span className="font-medium text-foreground">{item.name}: </span>
      <span className="text-muted-foreground">{item.value}</span>
    </div>
  )
}

export function DonutChart({ title, description, data, className }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className={cn("rounded-xl border bg-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-52 w-full max-w-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-foreground">{total}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
            return (
              <li key={d.name} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="flex-1 text-muted-foreground">{d.name}</span>
                <span className="font-medium text-foreground">{d.value}</span>
                <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
