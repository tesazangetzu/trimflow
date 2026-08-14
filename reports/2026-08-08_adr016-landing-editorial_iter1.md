# Reporte de Ejecución — Iteración 1
## ADR-016: Reconstrucción editorial de la landing pública `/[slug]`

> **Fecha:** 2026-08-08
> **Proyecto:** TrimFlow
> **Objetivo:** Reconstruir la composición visual de la landing pública `/[slug]` desde la apariencia «dashboard» (grillas de tarjetas `surface`, dorado masivo) hacia una estética **editorial / premium / cinematográfica** (8 secciones, listas numeradas, hairlines, whitespace), manteniendo intactos la identidad ADR-015, el esquema ADR-013, los contratos públicos y la lógica de reservas.
> **Modo:** TRIGGER=ORCHESTRATOR MODE=AUTO (ejecución del Executor-agent)

---

## Resumen

Se ejecutó el plan completo en 5 fases:

- **FASE A/B (defaults sincronizados):** `heroTitle` pasa de `''` al headline editorial global **«EL CORTE QUE TE DEFINE.»** y `heroSubtitle` al copy editorial **«Técnica clásica, actitud moderna. Cada corte una decisión de estilo.»** en `LANDING_DEFAULTS` del backend y su espejo frontend, byte a byte idénticos (verificado programáticamente).
- **FASE C (componentes):** remake editorial de `LandingHero` (hero `min-h-[100svh]`, eyebrow = tagline + `shop.name`, headline default, doble CTA, fallback tipográfico/geométrico sin imagen, marquesina franja fina), `LandingSections` (Intro → Servicios listados numerados → Equipo lista editorial → Experiencia → Horarios·Ubicación unificada), `LandingCTA` (titular «¿LISTO PARA TU PRÓXIMO CORTE?» + botón único), `LandingFooter` (marca + navegación + datos reales de branch, sin redes), `LandingNav` (CTA «RESERVAR CITA», mismo esqueleto) y orquestación `LandingPage` (constante `DEFAULT_HERO_TITLE`, resolución del `heroTitle` como prop, nuevo orden de render, `branches` al footer).
- **FASE D (CSS):** bloque editorial nuevo en `globals.css` (`.landing-eyebrow`, `.landing-index`, `.landing-hairline`, `.landing-list-row` + hover, `.landing-hero-fallback`, escalas `clamp()` con `.landing-title`/`.landing-hero-title`), sin overflow horizontal (`.landing-page` y `.landing-marquee-band` con `overflow-x: clip` + mask), keyframes/transiciones gated por `prefers-reduced-motion`.
- **FASE E (verificación):** lint, tsc, tests y build en backend y frontend; `graphify update .` al cierre.

---

## Archivos modificados/nuevos

### Modificados (9)

| Archivo | Cambio |
|---------|--------|
| `backend/src/modules/landing/landing-config.ts` | `LANDING_DEFAULTS.presentation`: `heroTitle` → `'EL CORTE QUE TE DEFINE.'`; `heroSubtitle` → copy editorial; docline de `heroTitle` ajustada. Sin cambios de interfaz/paleta/typography/sections/`mergeObject`/`mergeLandingConfig`. |
| `frontend/src/types/landing.ts` | Espejo sincronizado byte a byte de `heroTitle`/`heroSubtitle`. |
| `frontend/src/components/landing/LandingPage.tsx` | Constante `DEFAULT_HERO_TITLE = "EL CORTE QUE TE DEFINE."`; `heroTitle` resuelto (`config.presentation.heroTitle?.trim() \|\| DEFAULT_HERO_TITLE`) y pasado a `LandingHero`; orden de render Nav→Hero→Sections→Gallery(`[]`)→Stats(`[]`)→CTA(si `config.sections.booking`)→Footer; `LandingFooter` recibe `branches={shop.branches}`. |
| `frontend/src/components/landing/LandingHero.tsx` | Hero cinematográfico: contenedor `min-h-[100svh]`, eyebrow (`.landing-eyebrow` tagline + `shopName`), headline `heroTitle` con escala `clamp()`, subtitle, CTA «RESERVAR CITA» (constante) → `/${slug}/reservar` y «VER SERVICIOS» (outline) → `#servicios`; imagen full-bleed velada + scrim si `hasHeroImage && heroImageUrl`, si no fallback `.landing-hero-fallback`; scroll hint mantenido; marquesina franja fina inferior (fallback de ticker como constante); se eliminaron icono `Scissors` (y su import), `box-shadow` brutalist del CTA y el nombre gigante como fallback del título. |
| `frontend/src/components/landing/LandingSections.tsx` | Remake editorial completo: `IntroSection` («MÁS QUE UN CORTE. UNA EXPERIENCIA.»), `ServicesSection` (lista numerada `.landing-list-row` + `.landing-hairline`, precio/duración mono muted — no dorado —, «RESERVAR ›» sin preselección, fuente `shop.branches.flatMap(services)`, `return null` sin servicios), `BarbersSection` (lista editorial, monograma tipográfico como `.landing-index`, slots condicionales specialty/foto, `return null` sin barbers), `ExperienceSection` («CLÁSICO EN LA TÉCNICA. MODERNO EN EL ESTILO.», asimétrica sin cards), `ScheduleLocationSection` (sección única «HORARIOS · UBICACIÓN», `id="horarios"` + marcador `id="ubicacion"`, datos reales por branch, ausentes no se pintan, sin copy «Reserva con antelación», `return null` sin datos). Se eliminaron `SectionTone`, `Card`, imports sin uso. Fondo `--landing-bg` en todas las secciones, `scroll-mt-24` en anclas. |
| `frontend/src/components/landing/LandingCTA.tsx` | Kicker `{shopName} · Reserva` mono muted, titular display «¿LISTO PARA TU PRÓXIMO CORTE?», apoyo body muted, botón único «RESERVAR CITA» (constante) con sweep, `.landing-pole` inferior mantenido. |
| `frontend/src/components/landing/LandingFooter.tsx` | Props ampliadas `{ slug, shopName, branches }`: marca + «Powered by TrimFlow», navegación (Servicios/Equipo/Horarios/Ubicación + `/${slug}/reservar`), ubicación/horarios solo con datos reales de branch, sin redes. |
| `frontend/src/components/landing/LandingNav.tsx` | CTA → «RESERVAR CITA» (constante, desktop y móvil); `NAV_LINKS` confirmado (Horarios→`#horarios`, Ubicación→`#ubicacion`); mismo esqueleto sticky + hilo dorado + indicador de sección activa, sin cajas tipo dashboard. |
| `frontend/src/app/globals.css` | Bloque «landing editorial ADR-016»: `.landing-title`/`.landing-hero-title` (clamp), `.landing-eyebrow`, `.landing-index`, `.landing-hairline`, `.landing-list-row` (+hover sutil), `.landing-hero-fallback`; `.landing-page` con `overflow-x: clip`; `.landing-marquee-band` con `overflow-x: clip` + mask; keyframes/transiciones nuevas dentro del bloque `prefers-reduced-motion` (`.landing-list-row` sin transición/hover bajo reduced-motion). `.landing-card` y su CSS conservados (los usa `LandingGallery`); los componentes de landing dejan de pintar cajas `surface`. |

### Nuevos (0)

Ninguno: todos los componentes existían (ADR-015); se reconstruyeron in-place. `LandingGallery`/`LandingStats`/`Reveal`/`landing-theme`/`LandingState` no se tocaron.

---

## Verificaciones ejecutadas

| # | Verificación | Comando | Resultado |
|---|--------------|---------|-----------|
| 1 | Lint backend | `npm run lint` | ⚠️ No ejecutable: `eslint` no está instalado en `backend/` (fuera de devDependencies; preexistente). Comprobado por ausencia de `node_modules/.bin/eslint`. Los reportes previos (ADR-015) tampoco lo ejecutaron. |
| 2 | Tests backend | `npm test` | ✅ 11 suites / 102 tests OK |
| 3 | Build backend | `npm run build` | ✅ OK (exit 0) |
| 4 | Lint frontend | `npm run lint` | ✅ Sin errores nuevos: 3 errores **preexistentes** en archivos no modificados (`BookingWizard.tsx:77`, `use-availability.ts:20`, `use-public-data.ts:37`) + 4 warnings `<img>` (2 preexistentes en `admin/landing`, 1 en `LandingGallery`, 1 en `LandingHero:42` — patrón ya aceptado). |
| 5 | Typecheck frontend | `npx tsc --noEmit` | ✅ Exit 0 |
| 6 | Tests frontend | `npm test` | ✅ 7 suites / 34 tests OK |
| 7 | Build frontend | `npm run build` | ✅ OK — 20 rutas (incluye `/[slug]` y `/[slug]/reservar` dinámicas) |
| 8 | Strings byte a byte | script node | ✅ `heroTitle` idéntico backend/frontend/DEFAULT_HERO_TITLE; `heroSubtitle` idéntico backend/frontend |
| 9 | Fuera de alcance | `git status` | ✅ Solo 9 archivos de landing config/components; 0 cambios en `.docs/`, backend de dominio, `layout.tsx`, `admin/landing`, `BookingWizard`, `LandingState`, `LandingGallery`, `LandingStats`, `Reveal`, `landing-theme`, `app/[slug]/page.tsx` |
| 10 | Graph | `graphify update .` | ✅ 3463 nodos, 5862 aristas, 240 comunidades |

### Verificación manual (dev server con tenant demo)

No se pudo ejecutar el stack completo (backend + Redis + Postgres + seed) en este entorno; la verificación manual queda **pendiente** para el ciclo de QA del Orquestador/Auditor. Confirma estáticamente:
- El seed demo (`backend/src/database/seeds/demo-seed.ts`) **no define** `settings.landing`, por lo que el tenant demo hereda `LANDING_DEFAULTS` → heading default «EL CORTE QUE TE DEFINE.» cuando `heroTitle` venga vacío (el override del tenant solo aplica si guarda config).
- Hero `min-h-[100svh]`, eyebrow = tagline + `shop.name`, CTA «RESERVAR CITA» → `/{slug}/reservar`, precios muted (no dorados), sección «HORARIOS · UBICACIÓN» sin copy «Reserva con antelación» / «Lunes a Domingo», sin overflow horizontal (`overflow-x: clip` en `.landing-page` y `.landing-marquee-band` + mask), `prefers-reduced-motion` desactiva marquesina/scroll/reveal/hover-de-filas.

---

## Estado

- [x] FASE A — Backend defaults (`heroTitle`/`heroSubtitle`)
- [x] FASE B — Espejo frontend (byte a byte)
- [x] FASE C — Componentes C1–C6
- [x] FASE D — CSS editorial + reduced-motion
- [x] FASE E — Lint/tsc/tests/build backend y frontend + `graphify update .`
- [x] Reporte de ejecución escrito
- [ ] Verificación manual en dev server con tenant demo (pendiente de entorno de QA)
- [ ] Auditoría del Auditor-agent

**Estado general: COMPLETADO** (implementación + verificaciones automáticas); pendiente únicamente la revisión visual en runtime y el veredicto del Auditor.

---

## Notas para el Auditor

1. **«RESERVAR CITA» sin preselección de servicio**: todos los CTA (hero, filas de servicios, equipo, CTA final, nav, footer) navegan directo a `/${slug}/reservar`; no se toca el `BookingWizard` ni query params.
2. **Dorado restringido**: el oro solo aparece en CTAs/botones, kickers (`.landing-eyebrow`), hairlines, indicadores/nav activo y escuadra `.landing-pole`. Precios, duración, horarios, direcciones y teléfonos son **muted**.
3. **Sección Horarios+Ubicación unificada**: se rinde una única sección con `id="horarios"` y un marcador `<span id="ubicacion">` (ambas anclas del nav funcionan; `useActiveSection` observa ambas). El gating respeta `config.sections.schedule`/`location` por línea: horario solo si `schedule` y hay `openingTime`/`closingTime`; dirección/teléfono solo si la línea procede (datos ausentes no se pintan). La sección se renderiza si `schedule || location` y hay datos.
4. **Marcadora `.landing-marquee`**: el `overflow-x: clip` + `mask-image` se aplicó en el contenedor `.landing-marquee-band` (no en el elemento animado `.landing-marquee`, que es `w-max` y por diseño desborda); en el elemento animado la máscara no tendría la referencia de ancho correcta. La keyframe `landing-marquee` se conserva y se pausa en reduced-motion.
5. **Headline**: `heroTitle` resuelto en `LandingPage` (fallback `DEFAULT_HERO_TITLE`) y pasado como prop; el default global (backend+espejo) también tiene «EL CORTE QUE TE DEFINE.» por lo que un tenant con config guardada que deje el campo vacío recibe el fallback del componente.
6. **`.landing-card`/`.landing-card-link`/`.landing-strop`** conservados en CSS (los usa `LandingGallery` / historial); los componentes de landing ya no pintan cajas `surface`.
7. **Peso de fuente**: Marcellus se carga solo en weight 400 (no `font-bold`), por lo que los titulares display usan `font-family` de la fuente display sin negrita sintetizada (estética editorial correcta; el kicker/CTA sí usa `font-semibold`/`font-bold` sobre mono/display).
8. **Fallback del hero**: `.landing-hero-fallback` es solo CSS (hairline dorada lateral + numeral `01` rotado deriva de la paleta) — no inventa URLs ni imágenes. El `<img>` del hero sigue usando `onError` para ocultarse si la URL falla (mismo patrón previo).
9. **Lint backend no disponible** (`eslint` fuera de devDependencies) — preexistente; se sugiere al Orquestador instalar/alinear con frontend en un ciclo trasero.

---

## Auditoría

Auditoría del Auditor-agent sobre `reports/2026-08-08_adr016-landing-editorial_iter1.md` contra `.docs` (fuente de verdad), el plan del Planner (`reports/contexto/planner-adr016-contexto.md`) y el código real.

### 1. Fuente de verdad validada

- **`.docs/requirements/mvp-scope.md`**: la landing pública y su personalización están dentro del alcance; la reconstrucción editorial (ADR-016) no introduce campo o requisito nuevo. La identidad dark luxury (ADR-015) es el default documentado. ✔
- **`.docs/architecture/modules.md`**: adjuntar frontend `components/landing/` coherente con los roles editoriales reconstruidos (Hero editorial, Section con sección unificada Horarios/Ubicación, Footer extraído, Gallery/Stats como capas preparadas). El paralelo estructural describe exactamente los componentes que existían. ✔
- **`.docs/decisions/ADR-013`**: el esquema se mantiene intacto — los 6 tokens `--landing-*`, el merge defensivo y la persistencia en `Tenant.settings.landing` sin migración. El hero reutiliza los campos EXISTENTES de `presentation.*` (tagline/heroTitle/heroSubtitle) y `branding.heroImageUrl`. No se añadió campo. ✔
- **`.docs/decisions/ADR-015`**: identidad dark luxury preservada — paleta `#0A0A0A/#111111/#8A8178/#F2EDE4/#C9A227/#C0392B`, fuentes Marcellus/Spectral/IBM Plex Mono, motivo gold-hairline (`landing-pole`) en sus 3 usos. ✔
- **`.docs/decisions/ADR-016`**: estructura de 8 secciones, hero global-default + tenant override, principios de dorado restringido, sin cajas `surface`, sin overflow horizontal, reduced-motion. Todos verificados en el código (ver más abajo).

### 2. Verificación del código (criterio por criterio)

**1. Estructura 8 secciones — ✔ cumplido.** `LandingPage.tsx` renderiza `LandingNav → LandingHero → LandingSections → LandingGallery([]) → LandingStats([]) → LandingCTA (si `config.sections.booking`) → LandingFooter`. `LandingSections.tsx` orquesta `IntroSection → ServicesSection → BarbersSection → ExperienceSection → ScheduleLocationSection`. Orden HERO → INTRO → SERVICIOS → EQUIPO → EXPERIENCIA → HORARIOS+UBICACIÓN → CTA → FOOTER, exactamente según la tabla del ADR-016 §1.

**2. Hero — ✔ cumplido.** `LandingHero.tsx`:
- `min-h-[100svh]` (L36).
- Eyebrow: tagline mono accent (`.landing-eyebrow`, L73) + linea de `shopName` muted mono (L78) — `shop.name` siempre presente como kicker adicional (permitido por ADR-016 §1.1).
- Headline: prop `heroTitle` (L87), resuelto en `LandingPage` con fallback `DEFAULT_HERO_TITLE = "EL CORTE QUE TE DEFINE."`.
- CTA primario «RESERVAR CITA» (constante, L9) → `/${slug}/reservar` (L102–113); CTA secundario «VER SERVICIOS» (L10) → `#servicios` con outline hairline (L114–126).
- Scroll hint discreto (L131–137), gated por reduced-motion en CSS.
- Imagen full-bleed `opacity-35` + scrim hacia `--landing-bg` si `hasHeroImage && heroImageUrl` (L40–55); si no, fallback `.landing-hero-fallback` puramente CSS (hairlines doradas + numeral `01`) — sin URLs inventadas (L59–61; `.landing-hero-fallback` en globals.css L433–465).
- Marquesina: franja fina inferior sobria, `overflow-x: clip` + mask en `.landing-marquee-band` (globals.css L498–502).

**3. Servicios — ✔ cumplido.** `ServicesSection` (LandingSections.tsx L57–128): fuente `shop.branches.flatMap` (L58); índice numerado `padStart(2,"0")` (`01, 02...`) en `.landing-index` (L77–80); hairline separador entre filas (L120); duración + precio en mono **muted** (`--landing-muted`, no dorado, L97–109); «RESERVAR ›» → `/${slug}/reservar` sin preselección (L110–117); sin tarjetas ni iconos; `return null` sin servicios.

**4. Equipo — ✔ cumplido.** `BarbersSection` (L132–206): lista editorial con nombre display en mayúsculas y hairline (L197); monograma tipográfico como `.landing-index` (L138–144, 164) — **no** círculos de iniciales como diseño principal; slot condicional `specialty` (L12–14, 175–186) que hoy no existe → nada; CTA «Reservar ›» por barbero.

**5. Horarios+Ubicación — ✔ cumplido.** `ScheduleLocationSection` (L249–313): sección única «HORARIOS · UBICACIÓN» con `id="horarios"` (L258) + marcador `id="ubicacion"` (L260); datos reales de `PublicBranch` (openingTime–closingTime, address, phone) pintados solo si existen; **sin** copy «Lunes a Domingo» ni «Reserva con antelación» (grep: 0 coincidencias); sin bandas `surface` grises (las secciones usan `--landing-bg`; grep `--landing-surface` en componentes reconstruidos: 0).

**6. CTA final — ✔ cumplido.** `LandingCTA.tsx`: kicker `{shopName} · Reserva` (L25, mayúsculas vía `.landing-eyebrow`); titular display «¿LISTO PARA TU PRÓXIMO CORTE?» (L27); único botón «RESERVAR CITA» (constante, L6, L49) con sweep (L44–48) y escuadra `.landing-pole` inferior (L58).

**7. Footer — ✔ cumplido.** `LandingFooter.tsx`: marca `shopName` + «Powered by TrimFlow» (L37–50); navegación con anclas Servicios/Equipo/Horarios/Ubicación + `/${slug}/reservar` (L53–76); ubicación/horarios solo con datos reales de `branchesWithData` (L23–25, L79–117); **sin** apartado de redes.

**8. Defaults sincronizados — ✔ cumplido (byte a byte).** Script node ejecutado: `heroTitle` idéntico en backend (`landing-config.ts`), espejo frontend (`types/landing.ts`) y `DEFAULT_HERO_TITLE` (`LandingPage.tsx`) → `"EL CORTE QUE TE DEFINE."`; `heroSubtitle` idéntico backend/frontend → `"Técnica clásica, actitud moderna. Cada corte una decisión de estilo."`.

**9. Principios — ✔ cumplido.** Dorado SOLO en CTAs, kickers (`.landing-eyebrow`), hairlines, indicadores/hilo/nav activo y marca del footer; precios/duración/horarios/direcciones/teléfonos en `--landing-muted`. Sin cajas `surface` grises (0 usos en componentes reconstruidos). Sin overflow horizontal: `.landing-page { overflow-x: clip }` (globals.css L276) y `.landing-marquee-band` clip + mask (L498–502). Reduced-motion: bloque `prefers-reduced-motion: reduce` (L551–582) desactiva marquesina, scroll chevron/hint, reveal, stagger del hero, transiciones de nav/card y padding/hover de `.landing-list-row`. Contraste AA según ADR-015 (accent `#C9A227` sobre `#0A0A0A` ≈ 8:1; no hay texto marfil sobre dorado).

**10. Restricciones — ✔ cumplido.** `git diff --name-only`: Solo los 9 archivos permitidos. No se tocaron: `BookingWizard`, `WIZARD_TOKENS`/`ReservationPage`, endpoints, `admin/landing`, esquema ADR-013/interfaces/merge, `layout.tsx`, `LandingGallery`/`LandingStats` (siguen retornando `null` sin datos), `Reveal`, `landing-theme`, `LandingState`, `app/[slug]/page.tsx`, `app/[slug]/reservar/page.tsx`. Sin campos nuevos. Sin datos inventados. «Barbería El Clásico» solo en seed demo y como `@ApiProperty` example del DTO (datos del tenant demo, no hardcode global).

**11. Verificación — ✔ cumplido (re-ejecutado por el Auditor).** Lint backend: `eslint` ausente de `backend/node_modules/.bin` (infra preexistente, ya reportado en ADR-015). Tests backend: 11 suites / 102 tests ✔. Build backend: exit 0 ✔. Lint frontend: 7 problemas = 3 errores `react-hooks/set-state-in-effect` en `use-availability.ts:20`, `use-public-data.ts:37` y `@next/next/no-html-link-for-pages` en `BookingWizard.tsx:77` — **archivos no modificados (preexistentes)** — + 4 warnings `<img>` (2 en `admin/landing`, 1 en `LandingGallery`, 1 en `LandingHero:42`, heredado de ADR-015). `npx tsc --noEmit`: exit 0 ✔. Tests frontend: 7 suites / 34 tests ✔. Build frontend: exit 0, incluye rutas dinámicas `/[slug]` y `/[slug]/reservar` ✔. `graphify update .` no re-ejecutado por el Auditor (operación con coste API); el reporte del Executor declara 3463 nodos / 5862 aristas — se acepta con la salvedad de regenerarlo en el ciclo QA.

### 3. Hallazgos

No se detectó falla funcional, de cumplimiento del ADR o de restricción. Los hallazgos son observaciones de mantenimiento/preexistentes (ver tabla más abajo).

## Veredicto del Auditor

**Veredicto:** ✅ APROBADO

### Fallas (si las hay)

Sin fallas bloqueantes ni observaciones que exijan cambios en esta iteración.

| # | Criterio | Severidad | Problema | Archivo | Corrección propuesta |
|---|----------|-----------|----------|---------|---------------------|

### Observaciones no bloqueantes (si las hay)

| # | Descripción | Severidad | Archivo |
|---|-------------|-----------|---------|
| 1 | Lint del backend no ejecutable: `eslint` está fuera de devDependencies de `backend/` (ausente en `node_modules/.bin`). Débito de infra **preexistente** (ya reportado en ADR-015); no es falla de este cambio, que solo modifica valores de string. | Baja | `backend/package.json` |
| 2 | El literal «RESERVAR CITA» se duplica en 3 constantes locales (`CTA_PRIMARY`, `NAV_CTA`, `CTA_LABEL`). El ADR permite «constantes globales del componente», así que es conforme; un único export compartido evitaría drift futuro. | Baja | `LandingHero.tsx`, `LandingNav.tsx`, `LandingCTA.tsx` |
| 3 | Warning `@next/next/no-img-element` en `LandingHero.tsx:42` (el `<img>` del hero). Patrón **heredado** de ADR-015 (el hero ya usaba `<img>`, ver `git show HEAD`); ya declarado por el Executor. Migrable a `next/image` en un ciclo posterior. | Baja | `LandingHero.tsx` |
| 4 | `TICKER_FALLBACK` (`["CORTES","BARBAS","ESTILO","RESERVA"]`) en `LandingHero.tsx` duplica `LANDING_DEFAULTS.presentation.tickerItems`; dado que la config siempre llega mergeada sobre defaults (no vacía), es dead code defensivo. | Baja | `LandingHero.tsx` |
| 5 | `.landing-scroll-hint` (regla sin capa, `display: inline-flex`) gana en cascada a los utilities `hidden sm:flex` de Tailwind v4 (en `@layer`), por lo que el indicador de scroll podría permanecer visible en móvil bajo motion normal. Comportamiento **preexistente** de ADR-015 (el diff solo cambió `bottom-16`→`bottom-24`); el gate de `prefers-reduced-motion` sí funciona. | Baja | `globals.css` / `LandingHero.tsx` |

### Criterios verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| 1. Estructura 8 secciones (HERO→INTRO→SERVICIOS→EQUIPO→EXPERIENCIA→HORARIOS+UBICACIÓN→CTA→FOOTER) | ✔ CUMPLIDO | `LandingPage.tsx:40-58` + `LandingSections.tsx:326-336`; orden exacto del ADR-016 §1 |
| 2. Hero cinematográfico (100svh, eyebrow tagline+shopName, headline con fallback, doble CTA, scroll hint, imagen/scrim o fallback sin URLs, marquesina sin overflow) | ✔ CUMPLIDO | `LandingHero.tsx:36,73-78,83-88,102-126,131-159`; `globals.css:433-465,498-502` |
| 3. Servicios: lista numerada + hairline, precio muted no dorado, RESERVAR sin preselección, `branches.flatMap`, sin cards | ✔ CUMPLIDO | `LandingSections.tsx:57-128` |
| 4. Equipo: lista editorial, monograma/índice sin círculos, slot especialidad condicional, CTA RESERVAR | ✔ CUMPLIDO | `LandingSections.tsx:132-206` |
| 5. Horarios+Ubicación unificada, datos reales, sin copy «Lunes a Domingo/Reserva con antelación», sin bandas surface | ✔ CUMPLIDO | `LandingSections.tsx:249-313`; grep 0 coincidencias de copy prohibido y de `--landing-surface` |
| 6. CTA final: «¿LISTO PARA TU PRÓXIMO CORTE?» + botón único | ✔ CUMPLIDO | `LandingCTA.tsx:27,34-53` |
| 7. Footer: marca + Powered by TrimFlow, navegación, ubicación/horarios reales, sin redes | ✔ CUMPLIDO | `LandingFooter.tsx:37-76,79-117` |
| 8. Defaults sync byte a byte (backend/frontend/DEFAULT_HERO_TITLE) | ✔ CUMPLIDO | Script node: `heroTitle` idéntico BE=FE=DEFAULT; `heroSubtitle` idéntico BE=FE |
| 9. Principios: dorado restringido, sin cajas surface, sin overflow-x, reduced-motion, contraste AA | ✔ CUMPLIDO | `globals.css:274-277,359-402,495-502,551-582`; paleta ADR-015 |
| 10. Restricciones: solo 9 archivos; BookingWizard/layout/Gallery/Stats/Reveal/theme/LandingState/pages intactos; sin campos, sin datos inventados, sin hardcode demo | ✔ CUMPLIDO | `git diff --name-only` (0 archivos fuera de rango); `LandingGallery.tsx:13` / `LandingStats.tsx:18` (`return null`); grep «El Clásico» solo en seed/DTO |
| 11. Verificación automática | ✔ CUMPLIDO | Backend: 11/102 tests + build exit 0. Frontend: tsc exit 0, 7/34 tests, build exit 0 (rutas `/[slug]`/`reservar`). Lint frontend: solo problemas preexistentes. Backend lint no ejecutable (infra preexistente) |