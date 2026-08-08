# Reporte Técnico Final
## Rediseño de la landing pública con identidad dark luxury (ADR-015)

> **Generado:** 2026-08-08
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.12 (App Router, React 19, Tailwind v4) + NestJS + PostgreSQL
> **Iteraciones realizadas:** 1
> **Veredicto final:** ⚠️ APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

Rediseñar la landing pública `/[slug]` (p.ej. `/barberia-el-clasico`) de TrimFlow con estética **dark luxury**: fondo negro carbón, dorado old-gold como acento, tipografía elegante, mobile-first y CTA de reserva visible. Mantener intacta la lógica de reservas (`BookingWizard` en `/[slug]/reservar`), la fuente de datos (`/v1/public/:slug`) y la multi-tenancy.

**Éxito cuando:**
- La primera impresión sea «barbería premium, quiero reservar», no una página CRUD.
- La estructura Navbar/Hero/Servicios/Barberos/Reserva/Footer se vea coherente en mobile 360/390/414px sin overflow horizontal.
- El flujo de reserva funcione exactamente igual que antes.
- Los tenants con configuración guardada conserven su paleta (multi-tenancy intacta).
- No haya datos inventados (dirección, teléfono, horarios, redes, cifras).
- Lint/typecheck/build pasen y el Auditor apruebe.

**Fuera de alcance:** backend de reservas, auth, appointments, schedule, disponibilidad, creación de citas, API pública, lógica del `BookingWizard`, esquema del panel admin.

**Opción elegida:** A — nuevo ADR-015 documentado (identidad dark luxury) que reemplaza la identidad ADR-014 («Umbral de tinta + libro de cuentas»).

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | ⚠️ APROBADO CON OBSERVACIONES | — (0 CRÍTICAS, 0 ALTAS; 1 MEDIA + 3 BAJAS documentadas) |

---

## Decisiones técnicas tomadas

### 1. Nueva identidad visual documentada en ADR-015 (dark luxury)

**Qué se decidió:**
Reemplazar la identidad «Umbral de tinta + libro de cuentas» (marfil/tan/oxblood, ADR-014) por una identidad dark luxury: fondo negro carbón (`#0A0A0A`), superficies `#111111`, texto marfil (`#F2EDE4`), acento dorado old-gold (`#C9A227`). Se documentó en un nuevo ADR-015 y se enmendaron ADR-013/014.

**Por qué:**
El programador eligió la Opción A (nuevo ADR) para que la decisión quede trazable en `.docs` como fuente de verdad. La estética dark luxury es la dirección premium solicitada para la landing pública.

**Alternativas descartadas:**
- Opción B (reutilizar ADR-014 con ajustes menores): no alcanzaba el nivel de cambio visual pedido.
- Opción C (cambiar solo el tenant demo): rompía la multi-tenancy y dejaba la landing por defecto sin identidad.

**Impacto en .docs:**
- Nuevo: `.docs/decisions/ADR-015-identidad-dark-luxury-landing.md`.
- Enmendados: ADR-013 (paleta de ejemplo), ADR-014 (identidad reemplazada), `modules.md`, `changelog/2026.md`, `mvp-scope.md`.

**Impacto en el código:**
Todos los componentes de la landing (`frontend/src/components/landing/*`) y los defaults (`backend/src/modules/landing/landing-config.ts`, `frontend/src/types/landing.ts`).

### 2. Sin migración del esquema de tokens (ADR-013)

**Qué se decidió:**
Reutilizar los 6 tokens existentes (bg/surface/fg/muted/accent/danger) cambiando solo los valores hex. No se migró el esquema de `Tenant.settings.landing`.

**Por qué:**
Evita migraciones de datos y mantiene compatibilidad con el panel admin y los tenants existentes. La multi-tenancy sigue funcionando: tenants con config guardada conservan su paleta hasta «Restaurar default».

**Alternativas descartadas:**
Añadir tokens nuevos (p.ej. `--landing-hero-*` como campos del esquema) — innecesario; se derivan de la paleta en `landingThemeVars`.

**Impacto en .docs:**
Ninguno (ADR-013 ya definía el esquema de 6 tokens).

**Impacto en el código:**
`landing-theme.ts` deriva `--landing-hero-*` de `config.palette` en runtime.

### 3. Capas preparadas para Galería y Stats (sin datos inventados)

**Qué se decidió:**
Crear `LandingGallery.tsx` y `LandingStats.tsx` como capas frontend que retornan `null` si no reciben datos. El payload público actual no expone galería ni stats, por lo que no se renderizan.

**Por qué:**
El ADR-015 prohíbe inventar cifras, fotos o contenido. Las capas quedan listas para cuando el payload las provea.

**Alternativas descartadas:**
Renderizar secciones con placeholders o datos ficticios — viola la restricción de no inventar datos.

**Impacto en .docs:**
ADR-015 §5 documenta estas capas preparadas.

**Impacto en el código:**
`LandingPage.tsx` las integra con `photos={[]}` / `stats={[]}`.

### 4. Footer extraído a componente propio

**Qué se decidió:**
Extraer el footer inline de `LandingPage` a `LandingFooter.tsx`, mostrando solo nombre del shop + «Powered by TrimFlow» + enlace «Reservar cita».

**Por qué:**
El ADR-015 exige un footer sin datos inventados (sin teléfonos, redes ni dirección hardcodeadas).

**Impacto en .docs:** Nada.
**Impacto en el código:** `LandingPage.tsx` integra el nuevo componente.

### 5. Contraste del wizard sobre fondo oscuro (solo CSS)

**Qué se decidió:**
En `ReservationPage.tsx`, subir `--border`/`--input` de 22% a 28% de opacidad para legibilidad sobre el fondo oscuro. Sin tocar la lógica del `BookingWizard`.

**Por qué:**
El wizard se renderiza sobre la nueva paleta dark; los bordes al 22% eran demasiado tenues.

**Alternativas descartadas:**
Modificar el `BookingWizard` — fuera de alcance.

**Impacto en .docs:** Nada.
**Impacto en el código:** Solo tokens CSS en `ReservationPage.tsx`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `.docs/decisions/ADR-015-identidad-dark-luxury-landing.md` | Documenta la nueva identidad visual (fuente de verdad) | Decisión 1 |
| `frontend/src/components/landing/LandingFooter.tsx` | Footer sin datos inventados | Decisión 4 |
| `frontend/src/components/landing/LandingGallery.tsx` | Capa de galería preparada (null sin datos) | Decisión 3 |
| `frontend/src/components/landing/LandingStats.tsx` | Capa de stats preparada (null sin datos) | Decisión 3 |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `backend/src/modules/landing/landing-config.ts` | `LANDING_DEFAULTS.palette` → hexes dark | Decisión 1 |
| `frontend/src/types/landing.ts` | Espejo de defaults → hexes dark | Decisión 1 |
| `frontend/src/components/landing/landing-theme.ts` | `--landing-hero-*` derivados de paleta | Decisión 2 |
| `frontend/src/components/landing/LandingHero.tsx` | Scrim + doble CTA + indicador scroll | Decisión 1 |
| `frontend/src/components/landing/LandingNav.tsx` | Scroll state + hamburguesa + motivo dorado | Decisión 1 |
| `frontend/src/components/landing/LandingSections.tsx` | Tarjetas premium + RESERVAR + slots condicionales | Decisión 1 |
| `frontend/src/components/landing/LandingCTA.tsx` | Fallbacks de color dark | Decisión 1 |
| `frontend/src/components/landing/LandingState.tsx` | Fallbacks de color dark | Decisión 1 |
| `frontend/src/components/landing/LandingPage.tsx` | Integra Footer/Gallery/Stats | Decisiones 3 y 4 |
| `frontend/src/app/[slug]/page.tsx` | Skeleton → fondo `#0A0A0A` | Decisión 1 |
| `frontend/src/app/[slug]/reservar/page.tsx` | Skeleton → fondo `#0A0A0A` | Decisión 1 |
| `frontend/src/components/booking/ReservationPage.tsx` | `--border`/`--input` 22%→28% | Decisión 5 |
| `frontend/src/app/globals.css` | Re-skin completo de la landing (gold-hairline, navbar, marquee, reveal) | Decisión 1 |
| `.docs/decisions/ADR-013-...` | Enmienda «Actualización» | Decisión 1 |
| `.docs/decisions/ADR-014-...` | Enmienda «Actualización» | Decisión 1 |
| `.docs/architecture/modules.md` | Actualización de módulos | Decisión 1 |
| `.docs/changelog/2026.md` | Entrada del cambio | Decisión 1 |
| `.docs/requirements/mvp-scope.md` | Actualización de alcance | Decisión 1 |

### Archivos eliminados

Ninguno.

---

## Cambios en archivos clave

### `frontend/src/app/globals.css`

**Antes:** Estilos de la identidad ADR-014 (barber-pole tricolor, marfil/tan/oxblood).
**Después:** Re-skin completo: `.landing-pole` → gold-hairline dorado, `.landing-card` con hairline dorado 40%→100% en hover, `.landing-card-link` (outline dorado → relleno), `.landing-nav` con scroll state + blur, `.landing-marquee`, `.landing-scroll-hint`, `.landing-reveal`, todo gated por `prefers-reduced-motion`.
**Por qué es importante:** es el archivo que define la firma visual de TODA la landing; cualquier cambio aquí afecta a `/[slug]` y `/[slug]/reservar`.

### `frontend/src/components/landing/landing-theme.ts`

- **Antes:** mapeaba la paleta a variables CSS con valores fijos.
- **Después:** deriva `--landing-hero-*` de `config.palette` en runtime (multi-tenancy).
- **Por qué es importante:** garantiza que cada tenant con config guardada reciba su propia paleta sin hardcoding.

### `frontend/src/components/booking/ReservationPage.tsx`

- **Antes:** `--border`/`--input` al 22% de opacidad.
- **Después:** 28% para contraste sobre fondo oscuro. Sin cambios de lógica.
- **Por qué es importante:** el wizard de reserva es la pieza crítica del negocio; cualquier cambio aquí debe ser solo visual.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Paleta exacta en backend y frontend | ✅ Cumple | `landing-config.ts:72-79` y `types/landing.ts:58-65` idénticas al ADR-015 |
| Sin datos inventados | ✅ Cumple | «Lunes a Domingo» eliminado; slots condicionales vacíos; Footer sin redes; Gallery/Stats `null` |
| Booking intacto | ✅ Cumple | `BookingWizard.tsx` no aparece en `git status`; diff solo CSS |
| Multi-tenancy | ✅ Cumple | `landingThemeVars` deriva de `config.palette`; `mergeLandingConfig` sin cambios |
| Fuera de alcance respetado | ✅ Cumple | Sin cambios en backend de dominio, `layout.tsx` ni `admin/landing` |
| Componentes nuevos | ✅ Cumple | Footer/Gallery/Stats existen y cumplen su propósito |
| Calidad visual | ✅ (con desvío menor) | Scrim + doble CTA, navbar con scroll state, hairline dorado, animaciones gated |
| Verificaciones técnicas | ✅ Cumple | Typecheck y build OK en backend y frontend; lint sin errores nuevos |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | ~~F-01: kicker del CTA band con contraste ≈1.1:1~~ **CORREGIDA** (cambiado a `var(--landing-muted)`, 5.2:1 AA) | ~~MEDIA~~ ✅ | `LandingCTA.tsx:22` | Resuelta |
| 2 | O-01: conteo de warnings del reporte (6 reales, no 5) | BAJA | `reports/2026-08-08_adr015-landing-luxury_iter1.md` | Baja prioridad |
| 3 | O-02: `--landing-hero-muted` derivado de smoke (`#8A8178`) en vez del sugerido `#B4A99C` | BAJA | `landing-theme.ts` | Baja prioridad (5.2:1 AA, cumple) |
| 4 | O-03: hexes hardcodeados en skeletons previos al load de config | BAJA | `[slug]/page.tsx`, `[slug]/reservar/page.tsx` | Baja prioridad |
| 5 | 3 errores de lint preexistentes (ajenos a este trabajo) | MEDIA | `BookingWizard.tsx:77`, `use-availability.ts:20`, `use-public-data.ts:37` | Antes de próximo trabajo de booking |

---

## Lo que el programador debe saber

- **La landing ahora es dark luxury por defecto** para todos los tenants nuevos; los tenants con config guardada conservan su paleta hasta «Restaurar default» en el panel admin.
- **No se inventó ningún dato**: dirección, teléfono, horarios, redes y cifras solo aparecen si el payload los entrega. Galería y Stats son capas preparadas que hoy no se ven.
- **El booking no se tocó**: solo se ajustaron dos tokens CSS de contraste en `ReservationPage.tsx`.
- **F-01 corregida**: el kicker del CTA band (`{shopName} · Reserva`) se corrigió a `var(--landing-muted)` (contraste ≈5.2:1, cumple WCAG AA).
- **Convención nueva**: la firma visual de la landing es el **gold-hairline** (`.landing-pole` redefinido); mantenerla en futuros cambios de la landing.
- **Lint**: hay 3 errores preexistentes en hooks de booking y `BookingWizard` que conviene limpiar en un trabajo futuro (no fueron introducidos aquí).

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-08_adr015-landing-luxury_iter1.md` |