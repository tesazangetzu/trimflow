"use client"

import { usePublicData } from "@/hooks/booking/use-public-data"
import { LandingState } from "@/components/landing/LandingState"
import { LandingNav } from "@/components/landing/LandingNav"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingSections } from "@/components/landing/LandingSections"
import { LandingCTA } from "@/components/landing/LandingCTA"
import { landingThemeVars } from "@/components/landing/landing-theme"
import { LANDING_DEFAULTS, type LandingConfig } from "@/types/landing"

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
        hasHeroImage={Boolean(config.branding.heroImageUrl)}
      />

      <LandingSections shop={shop} config={config} />

      {config.sections.booking && <LandingCTA slug={slug} shopName={shop.name} />}

      <footer
        className="py-8 text-center text-xs font-semibold uppercase tracking-[0.25em]"
        style={{
          color: "var(--landing-muted)",
          fontFamily: "var(--landing-font-mono)",
          background: "var(--landing-bg)",
        }}
      >
        <span style={{ color: "var(--landing-accent)" }}>{shop.name}</span> · Powered by TrimFlow
      </footer>
    </div>
  )
}