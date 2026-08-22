"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Branch } from "@/types/branch"

const ALL_BRANCHES = "all"

interface BranchFilterSelectProps {
  branches: Branch[]
  value: string | null
  onChange: (branchId: string | null) => void
  disabled?: boolean
}

export function BranchFilterSelect({
  branches,
  value,
  onChange,
  disabled = false,
}: BranchFilterSelectProps) {
  const items = [
    { value: ALL_BRANCHES, label: "Todas las sucursales" },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
  ]

  return (
    <Select
      items={items}
      value={value ?? ALL_BRANCHES}
      onValueChange={(v) => onChange(v === ALL_BRANCHES ? null : String(v))}
      disabled={disabled || branches.length === 0}
    >
      <SelectTrigger aria-label="Filtrar por sucursal" className="w-56">
        <SelectValue placeholder="Todas las sucursales" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
