"use client"

import { useEffect, useState } from "react"
import { Eye, Loader2, Palette, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToastManager } from "@/components/ui/toast"
import { ImageDropzone } from "@/components/admin/image-dropzone"
import * as landingService from "@/services/landing.service"
import { IMAGE_GUIDES, LANDING_DEFAULTS, type LandingConfig } from "@/types/landing"

const PALETTE_LABELS: Array<{ key: keyof LandingConfig["palette"]; label: string }> = [
  { key: "asphalt", label: "Fondo principal" },
  { key: "concrete", label: "Superficie / tarjetas" },
  { key: "smoke", label: "Texto secundario" },
  { key: "bone", label: "Texto principal" },
  { key: "neon", label: "Acento / CTA" },
  { key: "blood", label: "Alerta / destacado" },
]

const SECTION_LABELS: Array<{ key: keyof LandingConfig["sections"]; label: string }> = [
  { key: "services", label: "Servicios" },
  { key: "barbers", label: "Barbers" },
  { key: "schedule", label: "Horarios" },
  { key: "location", label: "Cómo llegar" },
  { key: "booking", label: "Reserva" },
]

export default function LandingPage() {
  const { add } = useToastManager()
  const [config, setConfig] = useState<LandingConfig | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    landingService
      .getConfig()
      .then((res) => {
        setConfig(res.config)
        setSlug(res.slug)
      })
      .catch(() => {
        add({
          title: "Error al cargar",
          description: "No se pudo cargar la configuración de la landing.",
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [add])

  const patch = <K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const patchPalette = (key: keyof LandingConfig["palette"], value: string) => {
    setConfig((prev) =>
      prev ? { ...prev, palette: { ...prev.palette, [key]: value } } : prev,
    )
  }

  const patchBranding = (key: keyof LandingConfig["branding"], value: string | null) => {
    setConfig((prev) =>
      prev ? { ...prev, branding: { ...prev.branding, [key]: value } } : prev,
    )
  }

  const patchPresentation = (key: keyof LandingConfig["presentation"], value: string) => {
    setConfig((prev) =>
      prev ? { ...prev, presentation: { ...prev.presentation, [key]: value } } : prev,
    )
  }

  const patchTickerItems = (value: string) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            presentation: {
              ...prev.presentation,
              tickerItems: value.split(",").map((s) => s.trim()).filter(Boolean),
            },
          }
        : prev,
    )
  }

  const patchSection = (key: keyof LandingConfig["sections"], value: boolean) => {
    setConfig((prev) =>
      prev ? { ...prev, sections: { ...prev.sections, [key]: value } } : prev,
    )
  }

  const reset = () => {
    setConfig(structuredClone(LANDING_DEFAULTS))
  }

  const save = async () => {
    if (!config) return
    setSaving(true)
    try {
      await landingService.updateConfig(config)
      add({
        title: "Cambios guardados",
        description: "La landing pública se actualizó correctamente.",
        type: "success",
      })
    } catch {
      add({
        title: "Error al guardar",
        description: "Revisa que los campos sean válidos e inténtalo de nuevo.",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!config) {
    return <div className="py-16 text-center text-muted-foreground">No hay configuración disponible.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1>Landing pública</h1>
            <p className="text-sm text-muted-foreground">
              Personaliza la página pública de tu barbería. Esta configuración solo afecta a tu landing,
              no a los paneles de administración.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="size-4" />
            Restaurar default
          </Button>
          {slug && (
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Eye className="size-4" />
                Ver mi landing
              </Button>
            </a>
          )}
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Presentación */}
        <Card>
          <CardHeader>
            <CardTitle>Presentación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tagline">Eslogan</Label>
                <Input
                  id="tagline"
                  value={config.presentation.tagline}
                  onChange={(e) => patchPresentation("tagline", e.target.value)}
                  placeholder="BARBERÍA · ESTILO URBANO"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroTitle">
                  Título del hero <span className="font-normal text-muted-foreground">(vacío = nombre)</span>
                </Label>
                <Input
                  id="heroTitle"
                  value={config.presentation.heroTitle}
                  onChange={(e) => patchPresentation("heroTitle", e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Subtítulo</Label>
              <Input
                id="heroSubtitle"
                value={config.presentation.heroSubtitle}
                onChange={(e) => patchPresentation("heroSubtitle", e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tickerItems">Marquesina (separada por comas)</Label>
              <Input
                id="tickerItems"
                value={config.presentation.tickerItems.join(", ")}
                onChange={(e) => patchTickerItems(e.target.value)}
                placeholder="CORTES, BARBAS, ESTILO, RESERVA"
              />
            </div>
          </CardContent>
        </Card>

        {/* Marca e imágenes */}
        <Card>
          <CardHeader>
            <CardTitle>Marca e imágenes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <ImageDropzone
                target="logo"
                value={config.branding.logoUrl}
                onChange={(url) => patchBranding("logoUrl", url)}
                guide={IMAGE_GUIDES.logo}
                previewClassName="h-12 w-12 rounded object-contain"
              />
            </div>
            <div className="space-y-2">
              <Label>Imagen del hero</Label>
              <ImageDropzone
                target="hero"
                value={config.branding.heroImageUrl}
                onChange={(url) => patchBranding("heroImageUrl", url)}
                guide={IMAGE_GUIDES.hero}
                previewClassName="h-24 w-full rounded object-cover"
              />
            </div>
          </CardContent>
        </Card>

        {/* Colores */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de colores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {PALETTE_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{config.palette[key]}</span>
                  <input
                    type="color"
                    value={config.palette[key]}
                    onChange={(e) => patchPalette(key, e.target.value)}
                    className="size-8 cursor-pointer rounded border bg-transparent p-0.5"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tipografía */}
        <Card>
          <CardHeader>
            <CardTitle>Tipografía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fontDisplay">Fuente display (títulos)</Label>
                <Input
                  id="fontDisplay"
                  value={config.typography.display}
                  onChange={(e) =>
                    patch("typography", { ...config.typography, display: e.target.value })
                  }
                  placeholder="Marcellus"
                />
                <p className="text-xs text-muted-foreground">Disponibles: Marcellus, Spectral, Poppins</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontBody">Fuente body (texto)</Label>
                <Input
                  id="fontBody"
                  value={config.typography.body}
                  onChange={(e) =>
                    patch("typography", { ...config.typography, body: e.target.value })
                  }
                  placeholder="Spectral"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secciones */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Secciones visibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {SECTION_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => patchSection(key, !config.sections[key])}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    config.sections[key]
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {label}
                  <span
                    className={`ml-3 inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${
                      config.sections[key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block size-3 rounded-full bg-white transition-transform ${
                        config.sections[key] ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
