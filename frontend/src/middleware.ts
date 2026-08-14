import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ROLES = {
  "super-admin": "/super-admin/dashboard",
  admin: "/admin/dashboard",
  barber: "/barber/dashboard",
} as const

type Role = keyof typeof ROLES

// Raíces de dashboard reservadas (nunca son slugs públicos de barbería)
const RESERVED_ROOTS = new Set(["login", "register", "admin", "barber", "super-admin"])

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value
  const { pathname } = request.nextUrl

  // Rutas públicas de la landing por slug: /[slug] y /[slug]/reservar.
  // Ninguno de sus segmentos debe colisionar con login/register ni con las
  // raíces de los dashboards.
  const segments = pathname.split("/").filter(Boolean)
  if (
    segments.length === 1 && !RESERVED_ROOTS.has(segments[0])
    || segments.length === 2 && segments[1] === "reservar" && !RESERVED_ROOTS.has(segments[0])
  ) {
    return NextResponse.next()
  }

  const publicPaths = ["/login", "/register"]
  if (publicPaths.includes(pathname)) {
    if (token) {
      const role = getRoleFromToken(token)
      if (role && role in ROLES) {
        return NextResponse.redirect(new URL(ROLES[role as Role], request.url))
      }
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const role = getRoleFromToken(token)
  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (
    pathname.startsWith("/super-admin") && role !== "super-admin" ||
    pathname.startsWith("/admin") && role !== "admin" ||
    pathname.startsWith("/barber") && role !== "barber"
  ) {
    const redirect = ROLES[role as Role]
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url))
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

function getRoleFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.role || null
  } catch {
    return null
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
