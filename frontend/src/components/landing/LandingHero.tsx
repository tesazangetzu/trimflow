import { Scissors } from "lucide-react"
import type { LandingConfig } from "@/types/landing"

interface LandingHeroProps {
  shopName: string
  config: LandingConfig
  hasHeroImage: boolean
}

export function LandingHero({ shopName, config, hasHeroImage }: LandingHeroProps) {
  const { presentation, branding } = config
  const title = presentation.heroTitle?.trim() || shopName
  const ticker = presentation.tickerItems?.length
    ? presentation.tickerItems
    : ["CORTES", "BARBAS", "ESTILO", "RESERVA"]

  return (
    <header className="relative overflow-hidden border-b-2 border-[var(--landing-accent)]">
      {/* Imagen de fondo (opcional, 16:9 panorámica) */}
      {branding.heroImageUrl && (
        <div className="pointer-events-none absolute inset-0">
          <img
            src={branding.heroImageUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(22,24,26,0.72), var(--landing-bg) 90%)",
            }}
          />
        </div>
      )}
      {/* Fondo con textura de rejilla street */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,239,233,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(242,239,233,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Resplandor neón */}
      <div
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--landing-accent)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Tagline stamp */}
        <div className="mb-6 flex items-center gap-3">
          <Scissors className="size-5 text-[var(--landing-accent)]" />
          <span
            className="inline-block border-2 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ borderColor: "var(--landing-accent)", color: "var(--landing-accent)" }}
          >
            {presentation.tagline || "BARBERÍA"}
          </span>
        </div>

        {/* Logo */}
        {branding.logoUrl && (
          <div className="mb-6">
            {/* Proporción recomendada: cuadrado 1:1, máx 512×512 */}
            <img
              src={branding.logoUrl}
              alt={`Logo de ${shopName}`}
              className="h-20 w-20 object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        )}

        {/* Nombre gigante con outline */}
        <h1
          className="max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
          style={{
            fontFamily: "var(--landing-font-display)",
            color: "var(--landing-fg)",
            WebkitTextStroke: hasHeroImage ? "2px var(--landing-fg)" : undefined,
            WebkitTextFillColor: hasHeroImage ? "transparent" : "currentColor",
          }}
        >
          {title}
        </h1>

        <p
          className="mt-6 max-w-xl text-base font-medium sm:text-lg"
          style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}
        >
          {presentation.heroSubtitle}
        </p>

        <a
          href="#reservar"
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-widest transition-transform hover:translate-y-[-2px]"
          style={{
            background: "var(--landing-accent)",
            color: "var(--landing-bg)",
            fontFamily: "var(--landing-font-display)",
            boxShadow: "6px 6px 0 0 var(--landing-bg), 6px 6px 0 2px var(--landing-accent)",
          }}
        >
          Reservar ahora
        </a>
      </div>

      {/* Marquesina street */}
      <div
        className="relative overflow-hidden border-t-2 py-3"
        style={{ borderColor: "var(--landing-accent)", background: "var(--landing-surface)" }}
      >
        <div className="flex w-max animate-[landing-marquee_28s_linear_infinite] gap-8 whitespace-nowrap">
          {[...ticker, ...ticker, ...ticker].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-8 text-sm font-black uppercase tracking-[0.3em]"
              style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-display)" }}
            >
              {item}
              <span style={{ color: "var(--landing-fg)" }}>✂</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}
