"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipPortal({ ...props }: TooltipPrimitive.Portal.Props) {
  return <TooltipPrimitive.Portal data-slot="tooltip-portal" {...props} />
}

function TooltipPositioner({
  className,
  ...props
}: TooltipPrimitive.Positioner.Props) {
  return (
    <TooltipPrimitive.Positioner
      data-slot="tooltip-positioner"
      className={cn("z-50", className)}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  children,
  ...props
}: TooltipPrimitive.Popup.Props) {
  return (
    <TooltipPortal>
      <TooltipPositioner>
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "rounded-lg bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10 z-50 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPositioner>
    </TooltipPortal>
  )
}

function TooltipArrow({ className, ...props }: TooltipPrimitive.Arrow.Props) {
  return (
    <TooltipPrimitive.Arrow
      data-slot="tooltip-arrow"
      className={cn("fill-popover", className)}
      {...props}
    />
  )
}

export {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipPositioner,
  TooltipTrigger,
}