import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function SkeletonKpiCard() {
  return (
    <Card>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export function SkeletonKpiGrid({ cols = 3 }: { cols?: 2 | 3 | 4 }) {
  const grid = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  }[cols]
  return (
    <div className={cn("grid gap-4", grid)}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonKpiCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonCard({ lines = 2, header = true }: { lines?: number; header?: boolean }) {
  return (
    <Card>
      {header && (
        <CardHeader className="border-b pb-3">
          <CardTitle>
            <Skeleton className="h-4 w-32" />
          </CardTitle>
          <Skeleton className="h-3 w-48" />
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="border-b pb-3">
        <CardTitle>
          <Skeleton className="h-4 w-32" />
        </CardTitle>
        <Skeleton className="h-3 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  )
}

export function SkeletonChartGrid({ charts = 2 }: { charts?: 2 | 3 }) {
  if (charts === 2) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonChart />
      </div>
    )
  }
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SkeletonChart className="lg:col-span-2" />
      <SkeletonChart />
      <SkeletonChart className="lg:col-span-2" />
      <SkeletonChart />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card className="overflow-hidden rounded-xl border bg-card">
      <CardHeader className="border-b pb-3">
        <CardTitle>
          <Skeleton className="h-4 w-32" />
        </CardTitle>
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-3 py-3.5">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b last:border-0">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      {c === 0 ? <Skeleton className="size-9 rounded-lg" /> : null}
                      <Skeleton className="h-3 w-full max-w-24" />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function SkeletonDetail({ formRows = 3, title = false }: { formRows?: number; title?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-6 w-40" />
          {title && <Skeleton className="h-4 w-56" />}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4 w-36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: formRows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function SkeletonList({ rows = 6, height = "h-12" }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full", height)} />
      ))}
    </div>
  )
}