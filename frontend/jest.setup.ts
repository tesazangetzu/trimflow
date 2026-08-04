import "@testing-library/jest-dom"

if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }

  if (!window.IntersectionObserver) {
    class MockIntersectionObserver {
      readonly root: Element | null = null
      readonly rootMargin = "0px"
      readonly thresholds: ReadonlyArray<number> = []
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: MockIntersectionObserver,
    })
  }

  window.scrollTo = window.scrollTo ?? (() => {})
  HTMLElement.prototype.scrollIntoView =
    HTMLElement.prototype.scrollIntoView ?? (() => {})
}