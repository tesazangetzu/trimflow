import type { ReactNode } from "react"
import { Clock, MapPin, Phone, Scissors } from "lucide-react"
import type { LandingConfig } from "@/types/landing"
import type { PublicShop } from "@/types/public"
import { Reveal } from "@/components/landing/Reveal"

type SectionTone = "light" | "warm"

/* ── Wrappers de sección ──────────────────────────────────────────────── */

function Section({
  id,
  kicker,
  title,
  tone,
  children,
}: {
  id: string
  kicker: string
  title: string
  tone: SectionTone
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24"
      style={{ background: tone === "warm" ? "var(--landing-surface)" : "var(--landing-bg)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <Reveal>
          <div>
            {/* Strop: hairline 1px + caret oxblood (ADR-014 §3) */}
            <div className="landing-strop" aria-hidden />
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
            >
              {kicker}
            </p>
            <h2
              className="text-3xl font-bold uppercase tracking-tight sm:text-4xl"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              {title}
            </h2>
          </div>
        </Reveal>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

function Card({ children, tone, delay = 0 }: { children: ReactNode; tone: SectionTone; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <div
        className="relative p-5 transition-transform hover:-translate-y-1"
        style={{ background: tone === "warm" ? "var(--landing-bg)" : "var(--landing-surface)" }}
      >
        {children}
      </div>
    </Reveal>
  )
}

/* ── Servicios ────────────────────────────────────────────────────────── */

function ServicesSection({ shop, tone }: { shop: PublicShop; tone: SectionTone }) {
  const services = shop.branches.flatMap((b) =>
    b.services.map((s) => ({ ...s, branchName: b.name })),
  )
  if (services.length === 0) return null

  return (
    <Section id="servicios" kicker="SERVICIOS" title="Lo que hacemos" tone={tone}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <Card key={s.id} tone={tone} delay={(i % 3) * 90}>
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex size-11 shrink-0 items-center justify-center"
                style={{ border: "1px solid var(--landing-accent)" }}
              >
                <Scissors className="size-5 text-[var(--landing-accent)]" />
              </div>
              <span
                className="text-lg font-semibold"
                style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
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
              <p className="mt-1 text-sm" style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}>
                {s.description}
              </p>
            )}
            <p
              className="mt-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
            >
              <Clock className="size-3.5" /> {s.durationMinutes} min
            </p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

/* ── Barberos ─────────────────────────────────────────────────────────── */

function BarbersSection({ shop, tone }: { shop: PublicShop; tone: SectionTone }) {
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
    <Section id="equipo" kicker="EL EQUIPO" title="Nuestros barbers" tone={tone}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {barbers.map((barber, i) => (
          <Card key={barber.id} tone={tone} delay={(i % 4) * 90}>
            <div
              className="mx-auto flex size-16 items-center justify-center rounded-full text-xl font-bold"
              style={{
                border: "1px solid var(--landing-accent)",
                color: "var(--landing-accent)",
                background: "var(--landing-bg)",
                fontFamily: "var(--landing-font-mono)",
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

function ScheduleSection({ shop, tone }: { shop: PublicShop; tone: SectionTone }) {
  const branches = shop.branches.filter((b) => b.openingTime && b.closingTime)
  if (branches.length === 0) return null

  return (
    <Section id="horarios" kicker="HORARIOS" title="Cuándo nos encuentras" tone={tone}>
      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((b, i) => (
          <Card key={b.id} tone={tone} delay={i * 100}>
            <h3
              className="text-base font-bold uppercase"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              {b.name}
            </h3>
            <p
              className="mt-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
            >
              <Clock className="size-4" />
              {b.openingTime} — {b.closingTime}
            </p>
            <p
              className="mt-1 text-xs uppercase tracking-wider"
              style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
            >
              Lunes a Domingo · Reserva con antelación
            </p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

/* ── Ubicación ────────────────────────────────────────────────────────── */

function LocationSection({ shop, tone }: { shop: PublicShop; tone: SectionTone }) {
  const branches = shop.branches.filter((b) => b.address || b.phone)
  if (branches.length === 0) return null

  return (
    <Section id="ubicacion" kicker="UBICACIÓN" title="Cómo llegar" tone={tone}>
      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((b, i) => (
          <Card key={b.id} tone={tone} delay={i * 100}>
            <h3
              className="text-base font-bold uppercase"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              {b.name}
            </h3>
            {b.address && (
              <p
                className="mt-3 flex items-start gap-2 text-sm"
                style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" />
                {b.address}
              </p>
            )}
            {b.phone && (
              <p
                className="mt-2 flex items-center gap-2 text-sm"
                style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
              >
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
      {config.sections.services && <ServicesSection shop={shop} tone="light" />}
      {config.sections.barbers && <BarbersSection shop={shop} tone="warm" />}
      {config.sections.schedule && <ScheduleSection shop={shop} tone="light" />}
      {config.sections.location && <LocationSection shop={shop} tone="warm" />}
    </>
  )
}