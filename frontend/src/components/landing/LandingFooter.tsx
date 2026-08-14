import Link from "next/link"
import type { PublicBranch } from "@/types/public"

const FOOTER_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#equipo", label: "Equipo" },
  { href: "#horarios", label: "Horarios" },
  { href: "#ubicacion", label: "Ubicación" },
]

interface LandingFooterProps {
  slug: string
  shopName: string
  branches: PublicBranch[]
}

/**
 * Footer editorial de la landing (ADR-016). Marca, navegación y datos reales
 * de branch. NO inventa redes ni telefonos: solo pinta horarios/ubicación
 * cuando `branches` trae datos; sin apartado de redes.
 */
export function LandingFooter({ slug, shopName, branches }: LandingFooterProps) {
  const branchesWithData = branches.filter(
    (b) => (b.openingTime && b.closingTime) || b.address || b.phone,
  )

  return (
    <footer
      style={{
        background: "var(--landing-bg)",
        borderTop: "1px solid color-mix(in srgb, var(--landing-accent) 30%, transparent)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Marca */}
          <div className="md:col-span-5">
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
            >
              {shopName}
            </p>
            <p
              className="mt-2 text-xs uppercase tracking-[0.2em]"
              style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
            >
              Powered by TrimFlow
            </p>
          </div>

          {/* Navegación */}
          <nav className="md:col-span-3" aria-label="Navegación de la landing">
            <ul className="space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs uppercase tracking-widest transition-colors hover:text-[var(--landing-accent)]"
                    style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href={`/${slug}/reservar`}
                  className="text-xs font-bold uppercase tracking-widest transition-colors"
                  style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
                >
                  Reservar cita
                </Link>
              </li>
            </ul>
          </nav>

          {/* Ubicación / horarios: solo si existen datos reales */}
          <div className="md:col-span-4">
            {branchesWithData.length > 0 ? (
              <ul className="space-y-4">
                {branchesWithData.map((b) => (
                  <li key={b.id} className="space-y-1">
                    <p
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-mono)" }}
                    >
                      {b.name}
                    </p>
                    {b.openingTime && b.closingTime && (
                      <p
                        className="text-xs"
                        style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                      >
                        {b.openingTime} — {b.closingTime}
                      </p>
                    )}
                    {b.address && (
                      <p
                        className="text-xs"
                        style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                      >
                        {b.address}
                      </p>
                    )}
                    {b.phone && (
                      <p
                        className="text-xs"
                        style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                      >
                        {b.phone}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  )
}