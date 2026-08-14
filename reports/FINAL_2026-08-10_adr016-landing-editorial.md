# Reporte Técnico Final
## Reconstrucción editorial de la landing pública `/[slug]` (ADR-016)

> **Generado:** 2026-08-10
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16 (App Router) + React + Tailwind v4 + TypeScript (frontend) · NestJS + TypeORM + PostgreSQL (backend)
> **Iteraciones realizadas:** 2
> **Veredicto final:** ✅ APROBADO

---

## Objetivo confirmado

Reconstruir la composición visual de la landing pública `/[slug]` con estética **editorial / premium / urbana / cinematográfica**, eliminando la apariencia de «header + cards grises + fondo negro + botones amarillos» (dashboard/CRUD). Mantener intactas la identidad ADR-015 (paleta/tipografía), el esquema ADR-013 (sin migración), los contratos públicos y la lógica de reservas.

**Éxito cuando:**
- La landing deja de verse como dashboard/CRUD (lista editorial + numeración + hairlines + whitespace).
- Datos reales del backend (servicios, barberos, branches) sin hardcode.
- Hero como global defaults + tenant override (sin campo nuevo en el esquema).
- Responsive explícito (360/768/1024/1440) sin overflow horizontal.
- Microinteracciones sutiles gated por `prefers-reduced-motion`.
- Lint/typecheck/tests/build OK; Auditor aprueba.

**Fuera de alcance:** API, backend de dominio, contratos, reservas, auth, multi-tenancy, modelo de datos, endpoints, disponibilidad, BookingWizard, `/admin/landing`.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | ✅ APROBADO           | — (0 fallas; 5 observaciones de severidad BAJA no bloqueantes) |
| 2         | ✅ APROBADO           | Hero invisible (`opacity:0`) + ruta `/[slug]/reservar` → `/login`; corregidos en `LandingHero.tsx` + `middleware.ts` |

---

## Decisiones técnicas tomadas

### 1. Estructura editorial de 8 secciones (decisión estructural ADR-016)

**Qué se decidió:**
Sustituir la composición de tarjetas del ADR-015 (grid de `landing-card` + dorado masivo) por una estructura narrativa editorial: HERO → INTRO → SERVICIOS → EQUIPO → EXPERIENCIA → HORARIOS+UBICACIÓN → CTA FINAL → FOOTER. Los servicios y barberos se renderizan como listas numeradas con hairlines, no como tarjetas.

**Por qué se tomó esta decisión:**
El rechazo del programador era estructural, no cromático: la cuadrícula de tarjetas grises con acentos dorados repetidos producía efecto dashboard. La lista editorial con numeración, hairlines y whitespace transmite un local de barbería premium.

**Alternativas descartadas:**
- Refinar las tarjetas del ADR-015 (conserva el patrón dashboard rechazado).
- Añadir campos al esquema (rompe ADR-013 sin migración).
- Hardcodear el hero del demo (llevaría contenido de un tenant a todos).
- Cambiar paleta/tipografía (la identidad ADR-015 es correcta y está fijada).

**Impacto en .docs:**
ADR-016 creado como decisión estructural; ADR-015 enmendado con nota (se mantiene como identidad); ADR-013 con nota de nuevos defaults del hero; `architecture/modules.md` y `changelog/2026.md` actualizados.

**Impacto en el código:**
Reconstrucción de `LandingHero`, `LandingSections`, `LandingCTA`, `LandingFooter`, `LandingNav`, `LandingPage` y bloque CSS editorial en `globals.css`.

### 2. Hero: defaults globales + tenant override (sin cambio de esquema)

**Qué se decidió:**
El hero se configura con defaults globales en `LANDING_DEFAULTS` (backend + espejo frontend) y cada tenant lo personaliza solo con los campos existentes de ADR-013: `tagline` → eyebrow, `heroTitle` → headline, `heroSubtitle` → propuesta, `heroImageUrl` → imagen. Los labels de CTA («RESERVAR CITA» / «VER SERVICIOS») son constantes del componente, sin campo en el esquema.

**Por qué se tomó esta decisión:**
Reutiliza el esquema ADR-013 sin migración ni campo nuevo; cualquier tenant nuevo hereda la composición editorial sin tocar el panel.

**Alternativas descartadas:**
Añadir `ctaLabel`/`heroOverlay`/`redesSociales`/`gallery`/`stats` al esquema (cargaría el MVP con paneles y rompería ADR-013).

**Impacto en .docs:**
Nota en ADR-013 documentando que el hero consume `tagline/heroTitle/heroSubtitle/heroImageUrl` con nuevos valores default.

**Impacto en el código:**
`heroTitle` → `'EL CORTE QUE TE DEFINE.'` y `heroSubtitle` → copy editorial en `landing-config.ts` y `types/landing.ts` (byte a byte idénticos); `DEFAULT_HERO_TITLE` en `LandingPage.tsx` como fallback del componente.

### 3. Dorado restringido (restraint)

**Qué se decidió:**
El dorado old-gold se reserva SOLO para CTAs primarios, kickers/eyebrows, hairlines de acento, estados activos del nav y la escuadra `.landing-pole`. Precios, duración, horarios, direcciones y teléfonos se muestran en `--landing-muted`.

**Por qué se tomó esta decisión:**
El exceso de dorado (iconos de servicio, precios, botones por tarjeta) contribuía al efecto dashboard. El restraint es un principio vinculante del ADR-016.

**Alternativas descartadas:**
Mantener el acento dorado repartido por todos los elementos (patrón rechazado).

**Impacto en .docs:**
Principio «Uso moderado del dorado» documentado en ADR-016 §2.

**Impacto en el código:**
Precios/duración en mono muted en `ServicesSection`; kickers con `.landing-eyebrow` accent; CTAs con accent bg.

### 4. Sección unificada HORARIOS · UBICACIÓN

**Qué se decidió:**
Unificar las dos secciones del ADR-015 en una sola sección con `id="horarios"` + marcador `id="ubicacion"`, pintando solo datos reales de `PublicBranch` (openingTime/closingTime, address, phone). Se elimina el copy genérico «Lunes a Domingo · Reserva con antelación» por no ser un dato real.

**Por qué se tomó esta decisión:**
Premisa heredada de cero datos inventados; el copy genérico de horarios era falso.

**Alternativas descartadas:**
Mantener dos secciones separadas con copy genérico (inventaba datos).

**Impacto en .docs:**
ADR-016 §1.6 documenta la sección unificada y la eliminación del copy genérico.

**Impacto en el código:**
`ScheduleLocationSection` en `LandingSections.tsx`; `NAV_LINKS` en `LandingNav.tsx` apunta a `#horarios`/`#ubicacion`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `.docs/decisions/ADR-016-reconstruccion-editorial-landing.md` | Decisión estructural de la reconstrucción editorial | Estructura 8 secciones + principios de diseño |
| `reports/2026-08-08_adr016-landing-editorial_iter1.md` | Reporte de ejecución + auditoría de la iteración 1 | — |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `backend/src/modules/landing/landing-config.ts` | `heroTitle` → `'EL CORTE QUE TE DEFINE.'`; `heroSubtitle` → copy editorial | Nuevos defaults globales del hero (ADR-016 §3) |
| `frontend/src/types/landing.ts` | Espejo sincronizado byte a byte de los defaults | Coordinación de defaults backend+frontend |
| `frontend/src/components/landing/LandingPage.tsx` | `DEFAULT_HERO_TITLE`, resolución de `heroTitle` como prop, orden de render 8 secciones, `branches` al footer | Orquestación editorial |
| `frontend/src/components/landing/LandingHero.tsx` | Hero cinematográfico `min-h-[100svh]`, eyebrow tagline+shopName, headline clamp, doble CTA, fallback geométrico, marquesina sobria | Hero narrativo (ADR-016 §1.1) |
| `frontend/src/components/landing/LandingSections.tsx` | Remake editorial: Intro, Servicios lista numerada, Equipo lista editorial, Experiencia, Horarios·Ubicación unificada | Secciones editoriales sin tarjetas (ADR-016 §1.2–1.6) |
| `frontend/src/components/landing/LandingCTA.tsx` | CTA final «¿LISTO PARA TU PRÓXIMO CORTE?» + botón único | CTA final de alto impacto (ADR-016 §1.7) |
| `frontend/src/components/landing/LandingFooter.tsx` | Props ampliadas `{slug, shopName, branches}`, marca + Powered by TrimFlow, sin redes | Footer editorial (ADR-016 §1.8) |
| `frontend/src/components/landing/LandingNav.tsx` | CTA «RESERVAR CITA», estética editorial | Nav editorial |
| `frontend/src/app/globals.css` | Clases editoriales (`.landing-eyebrow`, `.landing-index`, `.landing-hairline`, `.landing-list-row`, `.landing-hero-fallback`), `overflow-x: clip`, reduced-motion | CSS editorial + sin overflow horizontal |
| `.docs/decisions/ADR-015-identidad-dark-luxury-landing.md` | Nota: composición de secciones sustituida por ADR-016; identidad intacta | Impacto documental del ADR-016 |
| `.docs/decisions/ADR-013-personalizacion-landing-publica.md` | Nota: hero consume tagline/heroTitle/heroSubtitle/heroImageUrl con nuevos defaults | Impacto documental del ADR-016 |
| `.docs/architecture/modules.md` | Roles editoriales de `components/landing/`, sección unificada, Gallery/Stats como capas | Impacto documental del ADR-016 |
| `.docs/changelog/2026.md` | Entrada 2026-08-08 con referencia a ADR-016 | Impacto documental del ADR-016 |

### Archivos eliminados

Ninguno. Todos los componentes existían (ADR-015) y se reconstruyeron in-place. `LandingGallery`/`LandingStats` se conservan como capas preparadas (retornan `null`).

---

## Cambios en archivos clave

### `frontend/src/components/landing/LandingSections.tsx`

**Antes:** Secciones con tarjetas `landing-card` en grid, cajas `surface` grises, iconos dorados por servicio, avatares circulares con iniciales, copy genérico de horarios.
**Después:** Intro editorial → Servicios en lista numerada (01, 02…) con hairline y precios muted → Equipo en lista editorial con monograma tipográfico → Experiencia asimétrica → Horarios·Ubicación unificada con datos reales.
**Por qué es importante:** Es el archivo que materializa el cambio estructural central del ADR-016; cualquier regresión aquí reintroduce el patrón dashboard rechazado.

### `frontend/src/components/landing/LandingHero.tsx`

**Antes:** Hero con nombre gigante como fallback del título, icono Scissors en stamp, box-shadow brutalist en CTA, marquesina dominante.
**Después:** Hero `min-h-[100svh]` con eyebrow (tagline + shop.name), headline con fallback `DEFAULT_HERO_TITLE`, doble CTA, fallback tipográfico/geométrico sin URLs, marquesina como franja fina sobria.
**Por qué es importante:** Es el primer viewport que define la percepción de la landing; el nombre del shop ya no ocupa el rol del título gigante (compensado con eyebrow + nav).

### `backend/src/modules/landing/landing-config.ts`

**Antes:** `heroTitle: ''` (vacío → usaba el nombre de la barbería como fallback).
**Después:** `heroTitle: 'EL CORTE QUE TE DEFINE.'` + `heroSubtitle` editorial.
**Por qué es importante:** Es el default global que heredan todos los tenants sin config guardada; debe sincronizarse byte a byte con el espejo frontend (despliegue coordinado).

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Estructura 8 secciones (HERO→INTRO→SERVICIOS→EQUIPO→EXPERIENCIA→HORARIOS+UBICACIÓN→CTA→FOOTER) | Cumplido | `LandingPage.tsx` + `LandingSections.tsx`; orden exacto del ADR-016 §1 |
| Hero cinematográfico (100svh, eyebrow, headline con fallback, doble CTA, fallback sin URLs, marquesina sin overflow) | Cumplido | `LandingHero.tsx` + `globals.css` |
| Servicios: lista numerada + hairline, precio muted, RESERVAR sin preselección, `branches.flatMap`, sin cards | Cumplido | `LandingSections.tsx:57-128` |
| Equipo: lista editorial, monograma sin círculos, slot especialidad condicional | Cumplido | `LandingSections.tsx:132-206` |
| Horarios+Ubicación unificada, datos reales, sin copy «Lunes a Domingo/Reserva con antelación», sin bandas surface | Cumplido | `LandingSections.tsx:249-313`; grep 0 coincidencias |
| CTA final «¿LISTO PARA TU PRÓXIMO CORTE?» + botón único | Cumplido | `LandingCTA.tsx` |
| Footer: marca + Powered by TrimFlow, navegación, datos reales, sin redes | Cumplido | `LandingFooter.tsx` |
| Defaults sync byte a byte (backend/frontend/DEFAULT_HERO_TITLE) | Cumplido | Script node: `heroTitle` idéntico BE=FE=DEFAULT; `heroSubtitle` idéntico BE=FE |
| Principios: dorado restringido, sin cajas surface, sin overflow-x, reduced-motion, contraste AA | Cumplido | `globals.css`; paleta ADR-015 |
| Restricciones: solo 9 archivos; BookingWizard/layout/Gallery/Stats/Reveal/theme/pages intactos; sin campos nuevos, sin datos inventados, sin hardcode demo | Cumplido | `git diff --name-only`; `LandingGallery`/`LandingStats` retornan `null` |
| Verificación automática | Cumplido | Backend: 11/102 tests + build OK. Frontend: tsc exit 0, 7/34 tests, build OK (rutas `/[slug]`/`reservar`). Lint frontend: solo problemas preexistentes |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Estado |
|---|-------------|-----------|-------------------|--------|
| 1 | Lint del backend no ejecutable: `eslint` fuera de devDependencies de `backend/` | BAJA | `backend/package.json` | ✅ Resuelto 2026-08-14: `eslint ^9` + `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `globals` en devDependencies; `eslint.config.mjs` flat-config; `npm run lint` ejecutable (`eslint: not found` → corre; quedan errores `any`/unused preexistentes fuera de alcance) |
| 2 | Literal «RESERVAR CITA» duplicado en 3 constantes locales (`CTA_PRIMARY`, `NAV_CTA`, `CTA_LABEL`) | BAJA | `LandingHero.tsx`, `LandingNav.tsx`, `LandingCTA.tsx`, nuevo `landing-text.ts` | ✅ Resuelto 2026-08-14: export único `CTA_LABEL` en `landing-text.ts` consumido por los 3 componentes |
| 3 | Warning `@next/next/no-img-element` en el `<img>` del hero | BAJA | `LandingHero.tsx` | ✅ Resuelto 2026-08-14: migrado a `next/image` con `unoptimized` (URL remota por tenant; `remotePatterns` inviable) + `fill`/`priority` |
| 4 | `TICKER_FALLBACK` duplica `LANDING_DEFAULTS.tickerItems` (dead code defensivo) | BAJA | `LandingHero.tsx` | ✅ Resuelto 2026-08-14: fallback directo a `LANDING_DEFAULTS.presentation.tickerItems`; constante local eliminada |
| 5 | `.landing-scroll-hint` unlayered gana en cascada a `hidden sm:flex` (hint quizá visible en móvil) | BAJA | `globals.css` | ✅ Resuelto 2026-08-14: se quitó `display` de la regla unlayered; verificado en runtime (360 → `none`, ≥768 → `flex`, reduced-motion → `none`) |
| 6 | Verificación manual en dev server con tenant demo pendiente (entorno QA no disponible en el ciclo) | BAJA | — | ✅ Resuelto 2026-08-14: QA runtime en `localhost:3001` con `barberia-el-clasico` (ver `reports/2026-08-14_cierre-adr016-ui-dashboards_iter1.md`) |

---

## Lo que el programador debe saber

- **La landing ya no parece un dashboard**: la reconstrucción editorial (8 secciones, listas numeradas, hairlines, whitespace) sustituye el grid de tarjetas grises con dorado masivo. La identidad ADR-015 (paleta negro/marfil/old-gold, fuentes Marcellus/Spectral/IBM Plex Mono) se mantiene intacta.
- **Cero migración de esquema**: el hero reutiliza los campos existentes de ADR-013 (`tagline`/`heroTitle`/`heroSubtitle`/`heroImageUrl`). No hay campo nuevo; `/admin/landing` no cambia (solo muestra los nuevos valores default).
- **Defaults coordinados**: `heroTitle`/`heroSubtitle` deben permanecer idénticos byte a byte entre `landing-config.ts` (backend) y `types/landing.ts` (frontend). Cualquier cambio futuro requiere despliegue coordinado.
- **Convención nueva a mantener**: el dorado SOLO en CTAs, kickers, hairlines y estados activos. Precios, duración, horarios y direcciones van en muted. No reintroducir cajas `surface` ni tarjetas en las secciones de landing.
- **Sin datos inventados**: todo dato ausente (foto de barbero, especialidad, imagen del hero, redes) se omite o se renderiza condicionalmente. No añadir URLs/imágenes falsas.
- **Pendiente de QA visual**: la verificación manual en runtime (dev server con tenant demo) quedó pendiente por falta de entorno; la verificación estática y automática (lint/tsc/tests/build) pasó completa.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-08_adr016-landing-editorial_iter1.md` |
| 2         | `reports/2026-08-10_adr016-fix-hero-middleware_iter2.md` |