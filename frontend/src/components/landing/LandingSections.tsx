import Link from "next/link"
import type { LandingConfig } from "@/types/landing"
import type { PublicShop } from "@/types/public"
import { Reveal } from "@/components/landing/Reveal"

/*
 * Slots condicionales (ADR-016 §1.4): los datos que hoy no existen en el
 * payload público (especialidad/foto de barbero) se renderizan única y
 * exclusivamente si la fuente llega. Por defecto quedan ocultos;
 * NO se inventa ningún dato.
 */
interface BarberExtras {
  specialty?: string
}

/* ── Intro / Identidad ───────────────────────────────────────────────── */

function IntroSection() {
  return (
    <section className="scroll-mt-24" style={{ background: "var(--landing-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-6">
            <Reveal>
              <div>
                <p className="landing-eyebrow mb-4">IDENTIDAD</p>
                <h2 className="landing-title">MÁS QUE UN CORTE. UNA EXPERIENCIA.</h2>
              </div>
            </Reveal>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <Reveal delay={120}>
              <div className="flex flex-col gap-8">
                <div className="landing-hairline" aria-hidden />
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}
                >
                  La silla, la máquina, el detalle. Trabajamos con técnica clásica y
                  estética contemporánea para que cada visita termine en una decisión
                  de estilo, no en un corte improvisado.
                </p>
                <span className="landing-index" style={{ fontSize: "3.5rem", lineHeight: 1 }} aria-hidden>
                  01
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Servicios: lista editorial numerada con hairline ─────────────────── */

function ServicesSection({ shop, slug }: { shop: PublicShop; slug: string }) {
  const services = shop.branches.flatMap((b) =>
    b.services.map((s) => ({ ...s, branchName: b.name })),
  )
  if (services.length === 0) return null

  return (
    <section id="servicios" className="scroll-mt-24" style={{ background: "var(--landing-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <div>
            <p className="landing-eyebrow mb-3">Carta</p>
            <h2 className="landing-title">Servicios</h2>
          </div>
        </Reveal>

        <div className="mt-6">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i, 3) * 60}>
              <div>
                <div className="landing-list-row group">
                  <span className="landing-index" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3
                      className="text-xl uppercase sm:text-2xl"
                      style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
                    >
                      {s.name}
                    </h3>
                    {s.description && (
                      <p
                        className="text-sm"
                        style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}
                      >
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="landing-row-meta">
                    <span
                      className="whitespace-nowrap text-sm"
                      style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                    >
                      {s.durationMinutes} min
                    </span>
                    <span
                      className="whitespace-nowrap text-sm"
                      style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                    >
                      S/ {Number(s.price).toFixed(2)}
                    </span>
                    <Link
                      href={`/${slug}/reservar`}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors hover:text-[var(--landing-fg)]"
                      style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
                    >
                      Reservar
                      <span aria-hidden>›</span>
                    </Link>
                  </div>
                </div>
                {i < services.length - 1 && <div className="landing-hairline" aria-hidden />}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Equipo: lista editorial, monograma tipográfico, slots condicionales ─ */

function BarbersSection({ shop, slug }: { shop: PublicShop; slug: string }) {
  const barbers = shop.branches.flatMap((b) =>
    b.barbers.map((bar) => ({ ...bar, branchName: b.name })),
  )
  if (barbers.length === 0) return null

  const monogram = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

  return (
    <section id="equipo" className="scroll-mt-24" style={{ background: "var(--landing-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <div>
            <p className="landing-eyebrow mb-3">El equipo</p>
            <h2 className="landing-title">Barbers</h2>
          </div>
        </Reveal>

        <div className="mt-6">
          {barbers.map((barber, i) => {
            const extras = barber as unknown as BarberExtras
            return (
              <Reveal key={barber.id} delay={Math.min(i, 3) * 60}>
                <div>
                  <div className="landing-list-row group">
                    {/* Monograma tipográfico / numeral de índice (sin fotos ni círculos) */}
                    <span className="landing-index" aria-hidden>
                      {monogram(barber.name)}
                    </span>
                    <h3
                      className="min-w-0 text-xl uppercase sm:text-2xl"
                      style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
                    >
                      {barber.name}
                    </h3>
                    <div className="landing-row-meta">
                      {/* Slot condicional de especialidad: hoy no existe el dato → nada */}
                      {extras.specialty && (
                        <span
                          className="whitespace-nowrap px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                          style={{
                            color: "var(--landing-accent)",
                            border: "1px solid var(--landing-accent)",
                            fontFamily: "var(--landing-font-mono)",
                          }}
                        >
                          {extras.specialty}
                        </span>
                      )}
                      <Link
                        href={`/${slug}/reservar`}
                        className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors hover:text-[var(--landing-fg)]"
                        style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
                      >
                        Reservar
                        <span aria-hidden>›</span>
                      </Link>
                    </div>
                  </div>
                  {i < barbers.length - 1 && <div className="landing-hairline" aria-hidden />}
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Experiencia / diferencial ───────────────────────────────────────── */

function ExperienceSection() {
  return (
    <section className="scroll-mt-24" style={{ background: "var(--landing-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <Reveal>
              <div>
                <p className="landing-eyebrow mb-4">La experiencia</p>
                <h2 className="landing-title">CLÁSICO EN LA TÉCNICA. MODERNO EN EL ESTILO.</h2>
              </div>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <Reveal delay={120}>
              <div className="flex flex-col gap-8">
                <div className="landing-hairline" aria-hidden />
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}
                >
                  Métodos que no cambian, cortes que sí. Afilado, navaja y precisión
                  sobre una base de técnica clásica; textura, contraste y actitud
                  moderna en cada terminación.
                </p>
                <span className="landing-index" style={{ fontSize: "3.5rem", lineHeight: 1 }} aria-hidden>
                  02
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Horarios + Ubicación: sección única con datos reales de branch ───── */

function ScheduleLocationSection({ shop, config }: { shop: PublicShop; config: LandingConfig }) {
  const branches = shop.branches.filter(
    (b) =>
      (config.sections.schedule && b.openingTime && b.closingTime) ||
      (config.sections.location && (b.address || b.phone)),
  )
  if (branches.length === 0) return null

  return (
    <section id="horarios" className="scroll-mt-24" style={{ background: "var(--landing-bg)" }}>
      {/* Marcador de ubicación para la ancla del nav (#ubicacion) */}
      <span id="ubicacion" className="block" aria-hidden />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <div>
            <p className="landing-eyebrow mb-3">Sedes</p>
            <h2 className="landing-title">HORARIOS · UBICACIÓN</h2>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {branches.map((b, i) => (
            <Reveal key={b.id} delay={i * 80}>
              <div>
                <h3
                  className="text-xl uppercase"
                  style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
                >
                  {b.name}
                </h3>
                <div className="landing-hairline mt-5" aria-hidden />
                <div className="mt-5 flex flex-col gap-2.5">
                  {config.sections.schedule && b.openingTime && b.closingTime && (
                    <p
                      className="text-sm"
                      style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                    >
                      {b.openingTime} — {b.closingTime}
                    </p>
                  )}
                  {b.address && (
                    <p
                      className="text-sm"
                      style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}
                    >
                      {b.address}
                    </p>
                  )}
                  {b.phone && (
                    <p
                      className="text-sm"
                      style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                    >
                      {b.phone}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Export principal ─────────────────────────────────────────────────── */

export function LandingSections({
  shop,
  config,
  slug,
}: {
  shop: PublicShop
  config: LandingConfig
  slug: string
}) {
  return (
    <>
      <IntroSection />
      {config.sections.services && <ServicesSection shop={shop} slug={slug} />}
      {config.sections.barbers && <BarbersSection shop={shop} slug={slug} />}
      <ExperienceSection />
      {(config.sections.schedule || config.sections.location) && (
        <ScheduleLocationSection shop={shop} config={config} />
      )}
    </>
  )
}