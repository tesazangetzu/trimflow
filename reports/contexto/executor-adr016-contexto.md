# Contexto para Executor-agent — Implementación ADR-016 (reconstrucción editorial)

TRIGGER=ORCHESTRATOR MODE=AUTO

Actúas como el **Executor-agent** de TrimFlow. El Orquestador te invoca para implementar la **reconstrucción editorial** de la landing pública `/[slug]` según el ADR-016 y el plan del Planner.

## Tu rol

Ejecuta el plan completo. Usa `.docs` como fuente de verdad. Opera en modo automático: no esperes confirmación entre pasos salvo errores bloqueantes. Persiste el estado en `reports/2026-08-08_adr016-landing-editorial_iter1.md`.

## Archivos que DEBES leer antes de implementar

1. Plan del Planner: `reports/contexto/planner-adr016-contexto.md` (contiene el plan completo paso a paso)
2. Fuente de verdad: `.docs/decisions/ADR-016-reconstruccion-editorial-landing.md`
3. Identidad (se mantiene): `.docs/decisions/ADR-015-identidad-dark-luxury-landing.md`
4. Esquema (no migrar): `.docs/decisions/ADR-013-personalizacion-landing-publica.md`
5. Código actual: `frontend/src/components/landing/` (LandingPage, LandingHero, LandingNav, LandingSections, LandingCTA, LandingFooter, LandingGallery, LandingStats, Reveal, landing-theme), `frontend/src/types/landing.ts`, `frontend/src/types/public.ts`, `backend/src/modules/landing/landing-config.ts`, `frontend/src/app/globals.css`

## Resumen del plan (detalle completo en planner-adr016-contexto.md)

**FASE A — Backend defaults:**
- `backend/src/modules/landing/landing-config.ts`: `LANDING_DEFAULTS.presentation.heroTitle` = `'EL CORTE QUE TE DEFINE.'`; `heroSubtitle` = copy editorial (elegir una frase y repetirla idéntica en el espejo frontend). NO tocar interfaces, merge, paleta, secciones.

**FASE B — Frontend types:**
- `frontend/src/types/landing.ts`: espejo idéntico de los nuevos defaults.

**FASE C — Componentes (mantener props, rutas, hooks, Reveal, landing-theme):**
- `LandingPage.tsx`: constante `DEFAULT_HERO_TITLE = "EL CORTE QUE TE DEFINE."`; resolver `heroTitle = config.presentation.heroTitle?.trim() || DEFAULT_HERO_TITLE`; pasar prop a LandingHero; orquestar 8 secciones (Nav → Hero → Sections[intro→servicios→equipo→experiencia→horarios/ubicación] → Gallery[] → Stats[] → CTA si booking → Footer).
- `LandingHero.tsx`: min-h-[100svh]; eyebrow = tagline + shopName; headline = heroTitle prop; subtitle = heroSubtitle; CTA "RESERVAR CITA" → /[slug]/reservar; CTA "VER SERVICIOS" → #servicios; scroll hint; imagen full-bleed+scrim si heroImageUrl, si no fallback tipográfico/geométrico (sin URLs); marquesina sobria sin overflow horizontal; eliminar Scissors y box-shadow.
- `LandingSections.tsx`: INTRO ("MÁS QUE UN CORTE. UNA EXPERIENCIA.") doble columna sin cards; SERVICIOS lista numerada (01, 02...) con hairline, precio muted (NO dorado), RESERVAR → /[slug]/reservar sin preselección; EQUIPO lista editorial sin círculos de iniciales (monograma tipográfico o numeral), slot condicional specialty; EXPERIENCIA ("CLÁSICO EN LA TÉCNICA. MODERNO EN EL ESTILO.") asimétrica sin cards; HORARIOS+UBICACIÓN unificada (id="horarios" + marcador id="ubicacion"), datos reales de branch, eliminar "Reserva con antelación"/"Lunes a Domingo". Quitar Card/SectionTone si dejan de usarse; limpiar imports.
- `LandingCTA.tsx`: kicker `{shopName} · RESERVA` + "¿LISTO PARA TU PRÓXIMO CORTE?" + único botón "RESERVAR CITA" (sweep + hairline).
- `LandingFooter.tsx`: props ampliadas (slug, shopName, branches); marca + Powered by TrimFlow; navegación; ubicación/horarios si existen; SIN redes.
- `LandingNav.tsx`: mismo esqueleto; label CTA "RESERVAR CITA"; estética editorial; actualizar NAV_LINKS si horarios/ubicación unifican anclas.

**FASE D — CSS (`frontend/src/app/globals.css`):**
- Clases editoriales nuevas: `.landing-list-row`, `.landing-hairline`, `.landing-index`, `.landing-hero-fallback`, `.landing-eyebrow`; marquesina con `overflow-x: clip` + mask (sin scroll lateral); reducir `.landing-card` (mantenerla: la usa LandingGallery); keyframes gated por prefers-reduced-motion; escala tipográfica con clamp(); contraste AA.

**FASE E — Verificación:**
- Backend: `npm run lint`, `npm test`, `npm run build` (o `npx tsc --noEmit`).
- Frontend: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Verificar responsive (360/768/1024/1440 sin overflow horizontal), CTA de reserva funcionando, datos reales, sin errores de consola.
- `graphify update .` al final.

## Restricciones ABSOLUTAS

- NO tocar: BookingWizard, WIZARD_TOKENS, endpoints, admin/landing, esquema ADR-013, layout.tsx, LandingGallery/LandingStats (mantener null), Reveal, landing-theme, LandingState, use-public-data, use-reveal, use-active-section, app/[slug]/page.tsx, app/[slug]/reservar/page.tsx.
- NO modificar .docs/ (los cambios documentales los hace el Orquestador).
- NO inventar datos (horarios, direcciones, fotos, redes, cifras).
- NO hardcodear Barbería El Clásico como global.
- NO añadir campos al esquema.
- Respetar Next.js 16 (params: Promise<{slug}>; leer node_modules/next/dist/docs/ si hay dudas).
- Dorado SOLO en CTAs/kickers/hairlines/estados activos. Precios muted.
- Sin overflow horizontal.

## Entregable

Al terminar, escribe el reporte de ejecución en `reports/2026-08-08_adr016-landing-editorial_iter1.md` con:
- Resumen de cambios
- Archivos modificados/nuevos
- Verificaciones ejecutadas y resultados
- Estado (completado/pendiente)
- Notas para el Auditor

Devuelve en tu mensaje final: resumen de lo implementado, archivos tocados, y resultados de verificación.