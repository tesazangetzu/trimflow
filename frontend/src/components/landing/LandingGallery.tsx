import { Reveal } from "@/components/landing/Reveal"

interface LandingGalleryProps {
  photos: string[]
}

/**
 * Capa de galería preparada (ADR-015 §5): se renderiza SOLO si llega contenido.
 * Hoy el payload público no expone galería, por lo que se devuelve `null`.
 * No se inventan imágenes.
 */
export function LandingGallery({ photos }: LandingGalleryProps) {
  if (!photos || photos.length === 0) return null

  return (
    <section
      id="galeria"
      className="scroll-mt-24"
      style={{ background: "var(--landing-surface)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <Reveal>
          <div>
            <div className="landing-strop" aria-hidden />
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}
            >
              GALERÍA
            </p>
            <h2
              className="text-3xl font-bold uppercase tracking-tight sm:text-4xl"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              Nuestro trabajo
            </h2>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 90}>
              <div
                className="landing-card overflow-hidden"
                style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-surface)" }}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}