"use client"

import { usePublicData } from "@/hooks/booking/use-public-data"
import { LandingState } from "@/components/landing/LandingState"
import { LandingNav } from "@/components/landing/LandingNav"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingSections } from "@/components/landing/LandingSections"
import { LandingGallery } from "@/components/landing/LandingGallery"
import { LandingStats } from "@/components/landing/LandingStats"
import { LandingCTA } from "@/components/landing/LandingCTA"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { landingThemeVars } from "@/components/landing/landing-theme"
import { LANDING_DEFAULTS, type LandingConfig } from "@/types/landing"

const DEFAULT_HERO_TITLE = "EL CORTE QUE TE DEFINE."

export function LandingPage({ slug }: { slug: string }) {
  const { shop, loading, notFound, error, reload } = usePublicData(slug)

  if (loading) {
    return <LandingState state="loading" />
  }

  if (notFound) {
    return <LandingState state="notFound" />
  }

  if (error || !shop) {
    return <LandingState state="error" error={error} onRetry={reload} />
  }

  const config: LandingConfig = shop.landing ?? LANDING_DEFAULTS
  const heroTitle = config.presentation.heroTitle?.trim() || DEFAULT_HERO_TITLE

  return (
    <div
      className="landing-page min-h-screen"
      style={{ ...landingThemeVars(config), background: "var(--landing-bg)" }}
    >
      <LandingNav slug={slug} shopName={shop.name} />

      <LandingHero
        slug={slug}
        shopName={shop.name}
        config={config}
        heroTitle={heroTitle}
        hasHeroImage={Boolean(config.branding.heroImageUrl)}
      />

      <LandingSections shop={shop} config={config} slug={slug} />

      {/* Capas preparadas (ADR-015 §5): sin dato en el payload, retornan null */}
      <LandingGallery photos={[]} />
      <LandingStats stats={[]} />

      {config.sections.booking && <LandingCTA slug={slug} shopName={shop.name} />}

      <LandingFooter shopName={shop.name} slug={slug} branches={shop.branches} />
    </div>
  )
}