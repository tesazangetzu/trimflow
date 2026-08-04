"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  align?: "left" | "right"
  render: (row: T) => ReactNode
}

interface TransactionsTableProps<T> {
  title: string
  description?: string
  columns: Column<T>[]
  rows: T[]
  emptyLabel?: string
  className?: string
}

export function TransactionsTable<T>({
  title,
  description,
  columns,
  rows,
  emptyLabel = "Sin registros",
  className,
}: TransactionsTableProps<T>) {
  return (
    <Card className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      <CardHeader className="border-b pb-3">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn("py-3 text-xs uppercase tracking-wide", col.align === "right" && "text-right")}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={idx} className="transition-colors hover:bg-muted/20">
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn("py-3", col.align === "right" && "text-right")}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
