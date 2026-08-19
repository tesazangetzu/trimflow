# Iteración 2 — Smooth scroll (overshoot mobile) + panel hamburguesa overlay sólido

Fecha: 2026-08-19 · Modo: AUTO (orquestador)

## Resumen de lo implementado

### CAMBIO 1 — Helper `smoothScrollToSection` corregido

**Archivo:** `frontend/src/lib/smooth-scroll.ts`

Se reemplazó `el.scrollIntoView()` por cálculo manual de la posición Y absoluta con offset de navegación. El `scrollIntoView({ block: "start" })` en móvil quedaba el título pegado al borde superior (y en algunos navegadores producía overshoot por el anclaje al `scroll-margin`). Ahora se computa `getBoundingClientRect().top + window.scrollY - NAV_OFFSET` con `Math.max(0, y)`, respetando `prefers-reduced-motion`.

### CAMBIO 2 — Panel móvil como overlay con fondo sólido

**Archivo:** `frontend/src/app/globals.css`

- **2a.** `.landing-nav-panel` pasó de ser un simple colapso de altura a un overlay absoluto anclado en `top: 100%` del nav (el nav es `sticky`, por lo que establece el contexto de posicionamiento), con fondo sólido `var(--landing-bg)` y sin transparencia, por encima del contenido.
- **2b.** Se añadieron reglas `.landing-nav.is-open` y `.landing-nav.is-open.is-scrolled` **después** del bloque `.landing-nav.is-scrolled` para ganar en cascada: la barra superior muestra fondo sólido cuando el menú está abierto, evitando ver el contenido detrás por el `backdrop-filter`/transparencia del estado `is-scrolled`.

### CAMBIO 3 — Offset (opcional)

Se **dejó `scroll-mt-24`** en `LandingSections.tsx` y `LandingGallery.tsx`. Justificación: el JS manual ignora `scroll-margin`, y la regla `#equipo, #horarios, #ubicacion { scroll-margin-top: 64px }` de `globals.css` gana en cascada sobre `scroll-mt-24` para anclas nativas. El offset efectivo resultante es 64 px en ambos caminos. No se tocó `LandingSections.tsx` para minimizar el diff.

## Helper final (`frontend/src/lib/smooth-scroll.ts`)

```ts
"use client"

const NAV_OFFSET = 64

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Ancla a una sección de la landing por id, respetando reduced-motion. */
export function smoothScrollToSection(id: string): void {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
  window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion() ? "auto" : "smooth" })
}

/** Vuelve al top del documento. */
export function smoothScrollToTop(): void {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })
}
```

## CSS final del panel (`frontend/src/app/globals.css`)

```css
/* Panel de la hamburguesa (<md): overlay absoluto anclado bajo el nav, fondo
   sólido SIN transparencia, por encima del contenido. */
.landing-nav-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 0;
  overflow: hidden;
  background: var(--landing-bg);
  border-color: transparent;
  transition: max-height 0.3s ease, border-color 0.3s ease;
}
.landing-nav.is-open .landing-nav-panel {
  max-height: 24rem;
  border-color: var(--landing-surface);
}

/* Barra superior con fondo sólido cuando el menú está abierto (evita ver el
   contenido por transparencia). */
.landing-nav.is-open {
  background: var(--landing-bg);
}
.landing-nav.is-open.is-scrolled {
  background: var(--landing-bg);
  border-color: var(--landing-surface);
}
```

## Verificación

Ejecutado desde `/home/eduardo/trimflow/frontend`:

1. **`npm run lint`** — 7 problemas preexistentes (4 errors, 3 warnings) en archivos NO tocados (`use-tenant-name.ts`, etc.). **0 problemas nuevos** en archivos tocados.
2. **`npx tsc --noEmit`** — exit 0, sin errores de tipos.
3. **Dev server (:3001)** — responde `200`; el HTML compilado se sirve sin "Failed to compile" ni errores en el chunk de la landing.

## Desviaciones del plan

- **Ninguna funcional.** Solo se omitió la parte opcional de CAMBIO 3 (eliminar `scroll-mt-24` de `LandingSections.tsx`): se mantuvo `scroll-mt-24` porque el selector `#id { scroll-margin-top: 64px }` gana en cascada y el offset JS efectivo ya es 64 px. El plan autorizaba explícitamente esta opción.

## Archivos modificados

- `frontend/src/lib/smooth-scroll.ts`
- `frontend/src/app/globals.css`

## No tocado (según restricciones)

`BookingWizard.tsx`, `BookingStepSummary.tsx`, steps, backend, dashboards, `.docs`, y la animación del CodePen de la iteración 1.

---

## Auditoría — Agente Auditor (Iteración 2)

**Fuente de verdad:** `.docs/` · **Orden de validación:** requirements → architecture → decisions → plan del Planner → código `frontend/src/`.

### Criterios evaluados

**C1 — Smooth scroll: posición Y absoluta calculada una sola vez (sin deriva por URL bar)**
- `frontend/src/lib/smooth-scroll.ts:13` → `const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET`. La Y se computa una única vez, de forma síncrona, antes de invocar `window.scrollTo` (línea 14), sin re-leer el rect tras el scroll. Evita la deriva que produce re-anclajes con URL bar en iOS.
- **VEREDICTO: CUMPLIDO.**

**C2 — `prefers-reduced-motion` respetado**
- `smooth-scroll.ts:14` → `behavior: prefersReducedMotion() ? "auto" : "smooth"`; `smooth-scroll.ts:19` idem en `smoothScrollToTop`. Complementa el bloque `@media (prefers-reduced-motion: reduce)` de `globals.css:640-694`.
- **VEREDICTO: CUMPLIDO.**

**C3 — `NAV_OFFSET=64` coincide con el `scroll-margin-top`**
- `smooth-scroll.ts:3` → `const NAV_OFFSET = 64`; `globals.css:280-285` → `#servicios, #equipo, #horarios, #ubicacion { scroll-margin-top: 64px }`. Ambos = 64px. El JS ignora `scroll-margin` y aplica el offset manual; las anclas nativas (fallback) lo aplican vía CSS. `Math.max(0, y)` (`smooth-scroll.ts:14`) evita posiciones negativas.
- **VEREDICTO: CUMPLIDO.**

**C4 — Panel móvil como overlay absoluto, fuera del flujo (no empuja la página)**
- `globals.css:538-548` → `.landing-nav-panel { position: absolute; top: 100%; left: 0; right: 0; max-height: 0; overflow: hidden; ... }`. Al ser `absolute` con `top:100%` anclado al nav `sticky` (`LandingNav.tsx:62`, establece el contexto de posicionamiento), queda fuera del flujo y NO empuja el contenido.
- **VEREDICTO: CUMPLIDO.**

**C5 — Panel móvil con fondo sólido, sin transparencia**
- `globals.css:545` → `background: var(--landing-bg)` (sólido, sin `color-mix`/alpha) en el panel. No hereda la transparencia de `.is-scrolled`.
- **VEREDICTO: CUMPLIDO.**

**C6 — Cascada: `.is-open` gana sobre `.is-scrolled` (declarado después)**
- Orden en `globals.css`: `.landing-nav.is-scrolled` (línea 529) → `.landing-nav.is-open .landing-nav-panel` (549) → `.landing-nav.is-open` (556) → `.landing-nav.is-open.is-scrolled` (559). `.is-open` (0,2,0) y `.is-open.is-scrolled` (0,3,0) se declaran DESPUÉS de `.is-scrolled` (0,2,0), por lo que ganan en cascada. Con el menú abierto la barra superior queda sólida (`var(--landing-bg)`), sin ver el contenido detrás.
- **VEREDICTO: CUMPLIDO.**

**C7 — Uso en UI (ambos breakpoints)**
- `LandingNav.tsx:89` (desktop) y `LandingNav.tsx:146` (móvil) invocan `smoothScrollToSection(link.id)` con `preventDefault()`; `LandingNav.tsx:55` usa `smoothScrollToTop` en el logo. El panel móvil conserva `setOpen(false)` tras anclar (`LandingNav.tsx:147`).
- **VEREDICTO: CUMPLIDO.**

**C8 — Sin tocar lo fuera de alcance**
- `git diff` de la iteración afecta SOLO a `frontend/src/lib/smooth-scroll.ts` y `frontend/src/app/globals.css` (+ el reporte). No se tocó `BookingWizard.tsx`, `BookingStepSummary.tsx`, steps, `use-booking` (lógica de negocio), dashboards, backend, `.docs`, ni la animación del CodePen de la iteración 1 (`landing-wizard-step-in/out`, `globals.css:363-411`, intactos).
- **VEREDICTO: CUMPLIDO.**

**C9 — Compilación y lint**
- `npx tsc --noEmit` → exit 0 (sin errores de tipos).
- `npm run lint` → 4 errors + 3 warnings PREEXISTENTES en archivos no tocados (`use-public-data.ts`, `use-tenant-name.ts`, `use-availability.ts`, `BookingWizard.tsx:130`, warnings `<img>` en `admin/landing/page.tsx` y `LandingGallery.tsx:46`). **0 problemas** en los archivos tocados (`smooth-scroll.ts`, `globals.css`). La aparición de `LandingGallery.tsx` en el lint es una advertencia preexistente (`no-img-element`); ese archivo NO fue modificado en esta iteración.
- **VEREDICTO: CUMPLIDO.**

### Coherencia con `.docs/`

- **requirements (`mvp-scope.md`)** y **architecture**: no imponen comportamiento contradictorio; el cambio no altera el esquema ni los módulos.
- **decisions ADR-015** (líneas 58-60: nav transparente → translúcido al scroll; líneas 131,138: "excelente experiencia mobile", hamburguesa + transición): el fondo sólido del panel cuando el menú está abierto es una corrección deliberada del bug de mobile, alineada con el mandato de UX mobile de ADR-015. **No contradice** la transparencia del estado `is-scrolled`, que se conserva cuando el menú está cerrado.
- **ADR-016** (responsive explícito, accesibilidad, `prefers-reduced-motion`): respetado.
- **Plan del Planner (iter 1, `FINAL_...smooth-scroll-codepen-anim.md`)**: la única desviación es la opción autorizada de CAMBIO 3 (no eliminar `scroll-mt-24` en `LandingSections.tsx`); el offset efectivo es 64px por ambos caminos, según autorización del plan.

### Veredicto por criterio

| Criterio | Resultado |
|---|---|
| C1 Posición Y absoluta única (sin deriva) | ✅ CUMPLIDO |
| C2 `prefers-reduced-motion` | ✅ CUMPLIDO |
| C3 `NAV_OFFSET` = `scroll-margin-top` | ✅ CUMPLIDO |
| C4 Panel overlay absoluto (no empuja) | ✅ CUMPLIDO |
| C5 Panel con fondo sólido (sin transparencia) | ✅ CUMPLIDO |
| C6 Cascada `.is-open` > `.is-scrolled` | ✅ CUMPLIDO |
| C7 Uso en UI desktop y móvil | ✅ CUMPLIDO |
| C8 Fuera de alcance intacto | ✅ CUMPLIDO |
| C9 Compilación y lint | ✅ CUMPLIDO |

### Observaciones (no bloqueantes)

1. **Offset de anclas nativas depende de la cascada:** las secciones conservan `scroll-mt-24` (`LandingSections.tsx:20,64,147,212,258`, `LandingGallery.tsx:18` = 96px) y se compensa por el selector `#id { scroll-margin-top: 64px }` de `globals.css:280-285`. El JS es inmune a esto (64px fijos), pero si en el futuro se eliminara ese selector, el fallback de ancla nativa (sin JS) cambiaría a 96px. Limpiable en una iteración futura (quitar `scroll-mt-24`).
2. **Redundancia preexistente:** `html { scroll-behavior: auto }` en el bloque `prefers-reduced-motion` (`globals.css:641-643`) quedó redundante tras eliminar el smooth global en la iteración 1. Preexistente, fuera del alcance de esta iteración.
3. **Transición del panel bajo reduced-motion:** `.landing-nav-panel` conserva `transition: max-height/border-color` (no está en el bloque `@media reduce`). Preexistente y meramente cosmético; no afecta al scroll ni a la accesibilidad funcional.