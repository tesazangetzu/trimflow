# Reporte Iteración 5 — Morph form→card sin salto en el wizard de reserva

Fecha: 2026-08-19
Modo: ORCHESTRATOR / AUTO

## Resumen del cambio

Se rediseñó la transición de «continuar» del wizard de reserva de la landing pública. Se abandonó el patrón `step-out` + `collapse→0fr` + `summary-in` y se implementó un **morph por reducción de altura medida con JS**: la carcasa de salida ahora monta el form completo del paso que abandona a su altura natural, se mide su alto y el alto del card resumen (`offsetHeight`), reduce su altura hasta el del card con el easing editorial y hace cross-fade del contenido del form → resumen mientras se reduce. Al terminar, la carcasa se desmonta dejando un card persistente idéntico (handoff sin salto). El card NO anima su entrada: aparece porque la carcasa se convierte en él.

## Archivos modificados

1. `frontend/src/components/booking/BookingWizard.tsx`
2. `frontend/src/app/globals.css`

## Cambios

### `BookingWizard.tsx`
- **Eliminado** el estado `closing` y su efecto (doble rAF). Ya no se usa el colapso por `grid-rows`/`.is-closing`.
- **Añadido** el estado `morph` (`{ formHeight, cardHeight, shrinking } | null`) y los refs `formRef` / `summaryRef` / `morphRafRef`.
- **Nuevo `useLayoutEffect`** (dependencia `[leavingStep]`): si no hay `prefers-reduced-motion`, mide `formEl.offsetHeight` (form completo) y `summaryEl.offsetHeight` (card resumen); luego, en dos `requestAnimationFrame` encadenados, fija la altura al form (sin transición) y en el frame siguiente la reduce hasta el alto del card (ahí sí transiciona) con `shrinking: true`. Con `prefers-reduced-motion` retorna sin medir (la transición es instantánea).
- **Timeout de limpieza de `leavingStep`** ajustado de `300ms` a `600ms` (≥ duración de la reducción de 0.5s) y, con `prefers-reduced-motion`, a `0ms`. Al limpiar resetea `setLeavingStep(null)` y `setMorph(null)`.
- **`summaries` excluye el paso `leavingStep`** mientras la transición está activa (`if (leavingStep && s === leavingStep) continue`), evitando la duplicación (card apilada + carcasa).
- **JSX del stack**:
  - Las cards de `summaries` ya no se envuelven en `landing-wizard-summary-in` (render directo de `BookingStepSummary`); NO animan su entrada (handoff).
  - La carcasa `leavingStep` ahora es `.landing-wizard-morph` con altura inline (`morph.formHeight` / `morph.cardHeight`) y dos capas: `__form` (renderiza `renderStepContent(leavingStep)` completo, con `p-6` y border) y `__summary` (absoluta arriba, con `p-4` y `BookingStepSummaryContent`, layout idéntico al card persistente).
- **Mantenidos** los wrappers `handleNext` / `handlePrev` / `handleSetStep` (setean `isStepTransition` síncronamente), el estado `isStepTransition`, la clase `landing-wizard-form--delayed` en el form activo, el efecto de limpieza de `isStepTransition` (1300ms), el form activo con `key={booking.step}`, `renderStepContent`, `buildSummary` y el comportamiento de «editar».

### `globals.css`
- **Eliminadas** las clases/keyframes del patrón anterior: `.landing-wizard-form-exit`, `landing-wizard-step-out`, `.landing-wizard-collapse`, `.is-closing`, `.landing-wizard-summary-in` y `landing-wizard-summary-in`.
- **Añadidas** las del morph:
  - `.landing-wizard-morph`: `position: relative; overflow: hidden; pointer-events: none; transition: height 0.5s cubic-bezier(0.22, 1, 0.36, 1)` (easing editorial).
  - `.landing-wizard-morph__form`: `opacity: 1; transition: opacity 0.3s ease`.
  - `.landing-wizard-morph__summary`: `position: absolute; top: 0; left: 0; right: 0; opacity: 0; transition: opacity 0.3s ease`.
  - `.landing-wizard-morph.is-shrinking .landing-wizard-morph__form { opacity: 0 }` y `.landing-wizard-morph.is-shrinking .landing-wizard-morph__summary { opacity: 1 }` (cross-fade).
- **`prefers-reduced-motion`**: `.landing-wizard-morph { transition: none }`, `.landing-wizard-morph__form { display: none }`, `.landing-wizard-morph__summary { position: static; opacity: 1 }` → la carcasa equivale a un card y la transición es instantánea.
- **Se conservan** `.landing-wizard-form` (entrada del paso activo, `landing-wizard-step-in` 0.5s) y `.landing-wizard-form--delayed` (delay 0.75s).

## Decisiones técnicas

1. **Reducción de altura por JS (no grid-rows)**: se mide la altura real del form y del card con `offsetHeight` y se transiciona `height` con el easing editorial. Al montar la carcasa, la altura natural coincide con el form que sustituye (mismo contenido), así no hay salto inicial; la reducción se dispara en el frame siguiente (dos `rAF` encadenados: el primero «ancla» la altura al form para que la transición tenga un valor de partida concreto, el segundo la reduce al card).
2. **Cross-fade**: el form (`.landing-wizard-morph__form`) se desvanece y el resumen (`.landing-wizard-morph__summary`) aparece en paralelo mientras la altura se reduce.
3. **Handoff sin salto**: la capa de resumen usa exactamente el mismo layout que `BookingStepSummary` (border, `p-4`, flex `justify-between`, `rounded-2xl`, `bg-card`, `shadow-sm`), de modo que al desmontar la carcasa (timeout 600ms) el card persistente de `summaries` ocupa su lugar sin salto visual. Por eso el card apilado ya no anima su entrada.
4. **Evitar duplicación**: durante la transición, el paso `leavingStep` se excluye de `summaries`; su card aparece solo cuando la carcasa se desmonta.
5. **Borde/radio del form**: la capa `__form` lleva `rounded-2xl border border-border p-6` y la carcasa el `bg-card shadow-sm`, reproduciendo el chrome del form activo (que se monta con `rounded-2xl border border-border bg-card p-6 shadow-sm`). Se midió el alto de las capas (que incluyen el borde) para que el handoff con el card sea exacto.
6. **Accesibilidad**: la carcasa es `aria-hidden` y `pointer-events: none` (transitoria e inerte). El card persistente es el botón clickable («editar»).

## Verificación

### Lint y tipos (desde `frontend/`)
- `npx tsc --noEmit` → **0 errores** (exit 0).
- `npm run lint` → **7 problemas (4 errors, 3 warnings), todos preexistentes** y en archivos/regiones no tocados: `no-html-link-for-pages` en `BookingWizard.tsx` (`<a href="/login">`, preexistente) y 3 × `react-hooks/set-state-in-effect` en `use-availability.ts`, `use-public-data.ts`, `use-tenant-name.ts`. **No se introdujo ningún error nuevo.** El `useLayoutEffect` del morph llama a `setMorph` solo dentro de callbacks de `requestAnimationFrame` (patrón ya usado por el código), por lo que no dispara la regla.
- `npx eslint src/components/booking/BookingWizard.tsx` → solo el error preexistente `no-html-link-for-pages`.

### Dev server (:3001)
- Ruta `http://localhost:3001/barberia-el-clasico/reservar` responde **HTTP 200** y compila sin errores (chunks del wizard construidos, sin `Failed to compile` / `Module not found` / `SyntaxError`).

### Prueba interactiva (Playwright / Chromium) sobre datos reales del backend
- **Avance (servicio → barbero)**: la carcasa monta el form completo a **687px** y reduce hasta el card a **75px**, con deceleración suave (muestreo: 687 → 515 → 321 → 204 → 139 → 106 → 88 → 80 → 77 → 75). El form se desvanece (opacity 1 → 0) mientras el resumen aparece (opacity 0 → 1) en paralelo. La carcasa se desmonta (~557ms) y queda **1 card persistente** (1 botón «Editar»); el paso avanza a «Elige tu barbero». ✅
- **Sin duplicación**: durante y después de la transición solo hay 1 card resumen del paso completado. ✅
- **Editar (volver)**: al hacer click en el card, el form del paso anterior se re-expande (morph hacia atrás en marcha, heading «Elige un servicio», sin duplicación). ✅
- **`prefers-reduced-motion`**: con `emulateMedia({ reducedMotion: 'reduce' })` la carcasa nunca es visible (`GONE` a t=0), el paso avanza al instante a barbero con 1 card persistente. Transición instantánea. ✅
- **Consola**: 0 errores, 0 warnings (solo React DevTools/HMR info).

## Observaciones

- El borde de 1px del form/card está incluido en las capas medidas, por lo que el handoff entre la carcasa y el card persistente es exacto (sin salto de 2px).
- Se mantienen intactos los wrappers de cambio de paso, `isStepTransition`, el retardo de entrada del siguiente form (0.75s), `renderStepContent`, `buildSummary`, y el comportamiento de «editar».
- No se tocaron `.docs/`, `smooth-scroll.ts`, `LandingNav.tsx`, `ScrollToTopButton.tsx`, `use-booking.ts` ni el backend.
- Edge case menor (no bloqueante): dos avances en rápida sucesión (<600ms) re-miden la carcasa al cambiar `leavingStep`; el `useLayoutEffect` dependiente de `[leavingStep]` se re-ejecuta y resetea `morph`. No observable en uso normal.

---

## Auditoría

**Auditor:** Agente Auditor · **Modo:** ORCHESTRATOR / AUTO · **Fuente de verdad:** `.docs/` (requirements → architecture → decisions → Plan del Planner → código `frontend/src/`).

### Validación contra `.docs/`

| Capa | Fuente | Resultado |
|---|---|---|
| 1. Requirements | `.docs/requirements/mvp-scope.md` | ✅ La reserva por flujo 4 pasos (ADR-012) y la identidad dark luxury (ADR-015) se mantienen intactas en lógica y tokens. El morph es presentacional; no altera el alcance MVP. |
| 2. Architecture | `modules.md` (referencial) | ✅ No se tocó el backend ni los contratos `/v1/public/:slug`; el cambio es exclusivo del `BookingWizard` (capa de presentación). |
| 3. Decisions | ADR-012 / ADR-013 / ADR-015 / ADR-016 | ✅ Ver criterio 2. |
| 4. Plan del Planner | 7 criterios del morph | ✅ 6/7 cumplidos plenamente; 1 (criterio 6 "abandona step-out+collapse+summary-in") con observación documental (BAJA). |
| 5. Código | `BookingWizard.tsx`, `globals.css` | ✅ Ver criterios 3–5. |

### Criterio 1 — Cumplimiento del objetivo ✅

- La carcasa monta el form completo del paso a su altura natural (687px) y la reduce hasta el alto del card (75px) **ocultando el contenido mientras se reduce** (`overflow: hidden` + cross-fade `__form`→`__summary`). Correcto.
- El card **NO anima su entrada**: las cards de `summaries` se renderizan directas (se eliminó el wrapper `landing-wizard-summary-in`); el card "aparece" porque la carcasa se convierte en él (handoff). Correcto.
- **Editar** (click en card → re-expande a form vía `handleSetStep`) se mantiene tal cual y dispara el morph en sentido inverso (reporte confirma "morph hacia atrás en marcha"). Correcto.

### Criterio 2 — Coherencia con `.docs/` ✅ (1 observación BAJA)

- Easing editorial `cubic-bezier(0.22, 1, 0.36, 1)` en `.landing-wizard-morph` y tokens shadcn (`bg-card`, `border-border`, `rounded-2xl`, `shadow-sm`) mapeados por `WIZARD_TOKENS` a la paleta dark luxury. Coherente con ADR-015/016.
- No contradice ADR-012/013: la **lógica** de reserva (`useBooking`, `renderStepContent`, `buildSummary`, endpoints, contratos `PublicShop`) no se modifica.
- **BAJA · Coherencia documental**: ADR-015 (§premisas) y ADR-016 (§Lógica de reservas) dicen literalmente "BookingWizard no se toca / no se modifica". La intención es claramente "no cambiar la lógica de reserva ni la preselección"; este cambio es **solo presentación**. No es una contradicción funcional, pero convendría una nota de enmienda en ADR-015/016 o en `modules.md` indicando que la presentación del wizard se refinó (morph form→card) sin tocar lógica.

### Criterio 3 — Correctitud técnica ✅ (2 observaciones BAJA)

- **Medición `offsetHeight`**: correcta. Con `morph === null` la capa `__form` está en flujo normal (la `__summary` es `position: absolute`, fuera de flujo), así que `formEl.offsetHeight` mide la altura natural real; `summaryEl.offsetHeight` mide el card. Correcto.
- **Doble rAF**: correcto. El 1º rAF fija `height: formHeight` (valor explícito; las transiciones no arrancan desde `auto`, por eso se fija antes), el 2º la reduce a `cardHeight` activando la transición. Patrón válido.
- **Handoff sin salto**: exacto. La capa `__summary` replica el layout del card persistente (`flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left`) y la carcasa lleva `shadow-sm` como el card; bordes incluidos en `offsetHeight`. Al desmontar, el card persistente ocupa el mismo slot a la misma altura (75px) sin salto. Correcto.
- **Sin duplicación**: `if (leavingStep && s === leavingStep) continue` excluye el paso que sale de `summaries` durante la transición. Correcto (criterio 7).
- **`prefers-reduced-motion`**: respetado. JS retorna sin medir (`window.matchMedia(...)`) + CSS (`transition:none`, `__form{display:none}`, `__summary{position:static;opacity:1}`) + timeout `0ms`. Correcto.
- **BAJA · `morphRafRef` cleanup**: el ref guarda el id del rAF más reciente (el 1º se sobrescribe al programar el 2º); `cancelAnimationFrame` sobre un id ya disparado es no-op y, si el cleanup corre entre ambos frames, cancela el 2º. Correcto en la práctica; solo observación de higiene de estado.
- **BAJA · Doble avance rápido (<600ms)**: el `useLayoutEffect` dependiente de `[leavingStep]` se re-ejecuta y resetea `morph`, re-midiendo la carcasa. No observable en uso normal (ya documentado por el Executor).

### Criterio 4 — Regresiones ✅

- Se mantienen `handleNext` / `handlePrev` / `handleSetStep` (setean `isStepTransition` síncronamente), `isStepTransition`, el retardo `landing-wizard-form--delayed` (0.75s), el form activo con `key={booking.step}`, `renderStepContent`, `buildSummary` y el comportamiento de "editar".
- No se tocaron `smooth-scroll.ts`, `LandingNav.tsx`, `ScrollToTopButton.tsx`, `use-booking.ts`, `.docs/` ni el backend. `git status` confirma solo 2 archivos modificados (`BookingWizard.tsx`, `globals.css`) + el reporte nuevo.

### Criterio 5 — Calidad ✅

- **Verificado por el auditor**: `npx tsc --noEmit` → **0 errores** (exit 0). `npx eslint src/components/booking/BookingWizard.tsx` → solo el error **preexistente** `no-html-link-for-pages` (línea 189, branch `notFound`, `<a href="/login">`, no tocado). **Sin errores nuevos.**
- La claim del reporte sobre lint/tsc es consistente con la verificación.

### Veredicto: **APROBADO CON OBSERVACIONES**

Observaciones (ninguna bloqueante):

| # | Severidad | Observación |
|---|---|---|
| 1 | **BAJA** | Coherencia documental: ADR-015/016 dicen "no se toca BookingWizard"; el cambio es solo presentacional (morph), no toca lógica. Sugerir nota de enmienda en `.docs/`. |
| 2 | **BAJA** | `morphRafRef` guarda el id del rAF más reciente; cancelación es best-effort. Correcto en la práctica; higiene de estado. |
| 3 | **BAJA** | Doble avance rápido (<600ms) re-mide/reinicia `morph`. No observable en uso normal (ya documentado). |

El objetivo (form se reduce en altura ocultando contenido y se convierte en el card sin animación separada; "editar" intacto) se cumple, el easing editorial y los tokens dark luxury se respetan, la medición con `offsetHeight` + doble rAF y el handoff sin salto son correctos, no hay duplicación, `prefers-reduced-motion` se respeta, no hay regresiones funcionales ni errores de tsc/lint nuevos, y no se tocaron archivos fuera de alcance. Las tres observaciones son de severidad BAJA y no impiden el merge.

**Confirmación:** sección "## Auditoría" inyectada al final de `reports/2026-08-19_smooth-scroll-codepen-anim_iter5.md`.

---

## Ajuste post-revisión — Restaurar animación de "editar" (transición hacia atrás)

**Motivo:** durante la revisión, el programador observó que la animación de **editar** (click en card → re-expande a form) había cambiado con el morph. Se pidió conservar la animación anterior: el card sale lanzado hacia abajo y al fondo (step-out) y luego aparece el step.

**Cambio aplicado** (en `BookingWizard.tsx` y `globals.css`):

- Se añadió el estado `leavingMode: "morph" | "exit" | null` para distinguir la dirección de la transición.
- En el efecto sobre `booking.step` se calcula la dirección comparando índices en `STEP_ORDER`:
  - `currIndex > prevIndex` (hacia adelante, `next`) → **morph** (form se reduce hasta convertirse en el card).
  - `currIndex < prevIndex` (hacia atrás, `editar`/`prev`) → **exit** (card sale lanzado hacia abajo y al fondo, luego aparece el step).
- El `useLayoutEffect` de medición del morph ahora solo corre cuando `leavingMode === "morph"`.
- El JSX renderiza la carcasa morph solo en modo `morph`, y una carcasa `landing-wizard-form-exit` (con `BookingStepSummaryContent`) en modo `exit`.
- Se restauraron en `globals.css` las clases `.landing-wizard-form-exit` y el keyframe `landing-wizard-step-out` (translateY 120px + scale 0.9 + fade, 0.3s), y su manejo en `prefers-reduced-motion` (`animation: none`).
- El form del paso destino sigue apareciendo con `landing-wizard-form--delayed` (0.75s), de modo que en "editar" el card sale primero y luego aparece el step.

**Verificación:** `npx tsc --noEmit` → 0 errores. `npx eslint src/components/booking/BookingWizard.tsx` → solo el error preexistente `no-html-link-for-pages` (línea 203, `<a href="/login">`, no tocado). Ruta del wizard responde HTTP 200.