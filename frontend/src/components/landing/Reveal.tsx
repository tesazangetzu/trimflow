"use client"

import type { ReactNode } from "react"
import { useReveal } from "@/hooks/landing/use-reveal"

interface RevealProps {
  children: ReactNode
  /** Retraso en ms para staggar elementos (por defecto 0). */
  delay?: number
  className?: string
}

export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`landing-reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}