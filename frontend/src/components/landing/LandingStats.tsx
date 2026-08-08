import { Reveal } from "@/components/landing/Reveal"

export interface LandingStat {
  label: string
  value: string
}

interface LandingStatsProps {
  stats?: LandingStat[]
}

/**
 * Capa de stats preparada (ADR-015 §5): se renderiza SOLO si la config provee
 * un array de cifras. Hoy no se definen stats y está PROHIBIDO inventar cifras,
 * por lo que por defecto retorna `null`.
 */
export function LandingStats({ stats }: LandingStatsProps) {
  if (!stats || stats.length === 0) return null

  return (
    <section
      className="border-y"
      style={{
        background: "var(--landing-bg)",
        borderColor: "color-mix(in srgb, var(--landing-accent) 25%, transparent)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="text-center">
                <div
                  className="text-3xl font-bold sm:text-4xl"
                  style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-display)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em]"
                  style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
                >
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}