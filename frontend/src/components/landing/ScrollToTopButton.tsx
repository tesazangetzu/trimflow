"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { smoothScrollToTop } from "@/lib/smooth-scroll"

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!visible) return null

  const scrollTop = () => smoothScrollToTop()

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Volver arriba"
      className="landing-scroll-top-button fixed bottom-6 right-6 z-30 flex size-11 items-center justify-center"
    >
      <ArrowUp className="size-5" />
    </button>
  )
}