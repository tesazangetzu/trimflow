import { cn } from "@/lib/utils"

describe("cn", () => {
  it("combina clases básicas", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("resuelve conflictos con tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("ignora valores falsy", () => {
    expect(cn("a", undefined, null, false, 0, "b")).toBe("a b")
  })
})