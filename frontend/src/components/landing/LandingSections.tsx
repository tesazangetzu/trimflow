import type { ReactNode } from "react"
import { Clock, MapPin, Phone, Scissors } from "lucide-react"
import type { LandingConfig } from "@/types/landing"
import type { PublicShop } from "@/types/public"

/* ── Wrappers de sección ──────────────────────────────────────────────── */

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id?: string
  kicker: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="border-b-2 border-[var(--landing-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <p
          className="mb-2 text-xs font-bold uppercase tracking-[0.25em]"
          style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-display)" }}
        >
          {kicker}
        </p>
        <h2
          className="text-3xl font-black uppercase tracking-tight sm:text-4xl"
          style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
        >
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative border-2 p-5 transition-transform hover:-translate-y-1"
      style={{ borderColor: "var(--landing-surface)", background: "var(--landing-surface)" }}
    >
      {children}
    </div>
  )
}

/* ── Servicios ────────────────────────────────────────────────────────── */

function ServicesSection({ shop }: { shop: PublicShop }) {
  const services = shop.branches.flatMap((b) =>
    b.services.map((s) => ({ ...s, branchName: b.name })),
  )
  if (services.length === 0) return null

  return (
    <Section kicker="SERVICIOS" title="Lo que hacemos">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex size-11 shrink-0 items-center justify-center border-2"
                style={{ borderColor: "var(--landing-accent)" }}
              >
                <Scissors className="size-5 text-[var(--landing-accent)]" />
              </div>
              <span
                className="text-lg font-black"
                style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-display)" }}
              >
                S/ {Number(s.price).toFixed(2)}
              </span>
            </div>
            <h3
              className="mt-4 text-lg font-bold uppercase"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              {s.name}
            </h3>
            {s.description && (
              <p className="mt-1 text-sm" style={{ color: "var(--landing-muted)" }}>
                {s.description}
              </p>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--landing-muted)" }}>
              <Clock className="size-3.5" /> {s.durationMinutes} min
            </p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

/* ── Barberos ─────────────────────────────────────────────────────────── */

function BarbersSection({ shop }: { shop: PublicShop }) {
  const barbers = shop.branches.flatMap((b) =>
    b.barbers.map((bar) => ({ ...bar, branchName: b.name })),
  )
  if (barbers.length === 0) return null

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

  return (
    <Section kicker="EL EQUIPO" title="Nuestros barbers">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {barbers.map((barber) => (
          <Card key={barber.id}>
            <div
              className="mx-auto flex size-16 items-center justify-center rounded-full border-2 text-xl font-black"
              style={{
                borderColor: "var(--landing-accent)",
                color: "var(--landing-accent)",
                background: "var(--landing-bg)",
              }}
            >
              {initials(barber.name)}
            </div>
            <h3
              className="mt-4 text-center text-base font-bold uppercase"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              {barber.name}
            </h3>
          </Card>
        ))}
      </div>
    </Section>
  )
}

/* ── Horarios ─────────────────────────────────────────────────────────── */

function ScheduleSection({ shop }: { shop: PublicShop }) {
  const branches = shop.branches.filter((b) => b.openingTime && b.closingTime)
  if (branches.length === 0) return null

  return (
    <Section kicker="HORARIOS" title="Cuándo nos encuentras">
      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((b) => (
          <Card key={b.id}>
            <h3
              className="text-base font-bold uppercase"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              {b.name}
            </h3>
            <p
              className="mt-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--landing-accent)" }}
            >
              <Clock className="size-4" />
              {b.openingTime} — {b.closingTime}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider" style={{ color: "var(--landing-muted)" }}>
              Lunes a Domingo · Reserva con antelación
            </p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

/* ── Ubicación ────────────────────────────────────────────────────────── */

function LocationSection({ shop }: { shop: PublicShop }) {
  const branches = shop.branches.filter((b) => b.address || b.phone)
  if (branches.length === 0) return null

  return (
    <Section kicker="UBICACIÓN" title="Cómo llegar">
      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((b) => (
          <Card key={b.id}>
            <h3
              className="text-base font-bold uppercase"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              {b.name}
            </h3>
            {b.address && (
              <p className="mt-3 flex items-start gap-2 text-sm" style={{ color: "var(--landing-muted)" }}>
                <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" />
                {b.address}
              </p>
            )}
            {b.phone && (
              <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: "var(--landing-muted)" }}>
                <Phone className="size-4 shrink-0 text-[var(--landing-accent)]" />
                {b.phone}
              </p>
            )}
          </Card>
        ))}
      </div>
    </Section>
  )
}

/* ── Export principal ─────────────────────────────────────────────────── */

export function LandingSections({ shop, config }: { shop: PublicShop; config: LandingConfig }) {
  return (
    <>
      {config.sections.services && <ServicesSection shop={shop} />}
      {config.sections.barbers && <BarbersSection shop={shop} />}
      {config.sections.schedule && <ScheduleSection shop={shop} />}
      {config.sections.location && <LocationSection shop={shop} />}
    </>
  )
}