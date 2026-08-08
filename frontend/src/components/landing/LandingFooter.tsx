import Link from "next/link"

interface LandingFooterProps {
  shopName: string
  slug: string
}

/**
 * Footer dinámico de la landing (ADR-015). Extraído del footer inline de
 * `LandingPage`. NO inventa teléfonos, redes ni dirección: solo nombre del
 * shop + "Powered by TrimFlow" + enlace a la reserva.
 */
export function LandingFooter({ shopName, slug }: LandingFooterProps) {
  return (
    <footer
      className="py-10 text-center"
      style={{
        background: "var(--landing-bg)",
        borderTop: "1px solid color-mix(in srgb, var(--landing-accent) 35%, transparent)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
        >
          <span style={{ color: "var(--landing-accent)" }}>{shopName}</span> · Powered by TrimFlow
        </p>
        <Link
          href={`/${slug}/reservar`}
          className="landing-card-link mt-3 px-5 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Reservar cita
        </Link>
      </div>
    </footer>
  )
}