# Reporte de Ejecución — Iteración 2: Fix del salto en morph form→card del wizard

**Fecha:** 2026-08-18
**Trigger:** ORCHESTRATOR · AUTO
**Ámbito:** Solo `frontend/` (Next.js 16, React 19, Tailwind 4, shadcn/ui)

## Contexto

Tras la iteración 1, al hacer click en "Continuar" o al editar una sección en `/[slug]/reservar`, el form desaparece, se forma el card y luego hay un **salto hacia arriba**. La causa raíz real: la iteración 1 montaba el form COMPLETO del paso anterior (`renderStepContent(leavingStep)`) dentro de la carcasa que colapsa por `grid-template-rows`. Como ese form es alto (ej. `SelectService` con lista), al colapsar a 0 la altura total baja bruscamente y el contenido de abajo sube de golpe → salto.

**Solución:** la carcasa ya no monta el form alto; colapsa solo un **resumen compacto** (~60px) del paso saliente, extraído del contenido compartido de la card. Así el colapso de altura es mínimo y continuo.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/booking/BookingStepSummary.tsx` | Extracción de `BookingStepSummaryContent` (inner de la card, sin `button`); `BookingStepSummary` lo envuelve en su `<button>` manteniendo su API. |
| `frontend/src/components/booking/BookingWizard.tsx` | Helper `buildSummary(step)`, refactor del array `summaries`, y carcasa que colapsa el resumen compacto en vez del form alto. |
| `frontend/src/app/globals.css` | `animation-delay: 0.1s` en `.landing-wizard-summary-in` para que el resumen entre tras terminar fade+colapso. |

## Resumen de cambios

### `BookingStepSummary.tsx`
- **Paso 1:** Se creó y exportó `BookingStepSummaryContent({ label, value, meta? })` con el inner actual de la card (bloque `min-w-0` + bloque `flex shrink-0` con meta y "Editar"), SIN el `button`.
- `BookingStepSummary` conserva su API y `onClick`, y ahora envuelve ese contenido en su `<button>` existente (con la clase `group` para el `group-hover` de "Editar").

### `BookingWizard.tsx`
- **Paso 2:** Se añadió la función pura `buildSummary(step)` (closure sobre `booking`) que devuelve `{label, value, meta} | null` con la misma lógica de las líneas 166-181 originales (service → name + price; barber → name; date → fecha·hora; checkout → null).
- El array `summaries` se refactorizó para construirse con `buildSummary(s)` cuando `s !== paso activo` y esté completado. Comportamiento idéntico al actual.
- **Paso 3:** En la carcasa (bloque `landing-wizard-form-exit`) se calcula `leavingSummary = leavingStep ? buildSummary(leavingStep) : null`. En lugar de `renderStepContent(leavingStep)`, se renderiza `<BookingStepSummaryContent {...leavingSummary} />` cuando existe, o un placeholder `<div />` mínimo cuando es `null`. Padding de la carcasa ajustado de `p-6` a `p-4`. Se mantienen `aria-hidden`, `rounded-2xl`, `border`, `bg-card`.
- La carcasa YA NO monta `SelectService/SelectBarber/SelectDate/Checkout`. `renderStepContent` sigue usándose solo para el paso activo.

### `globals.css`
- **Paso 5:** Se añadió `animation-delay: 0.1s` a `.landing-wizard-summary-in` (easing `cubic-bezier(0.22,1,0.36,1)` ya presente). El fade (0.3s) y el colapso (0.3s) de la carcasa terminan a la vez; el resumen entra ~0.1s después, manteniendo el morph continuo. `.landing-wizard-collapse` se mantiene con `grid-template-rows: 1fr → 0fr`, `overflow:hidden` y `transition` (ahora colapsa solo ~60px).

## Verificación del flujo (Paso 4)

- **Avanzar (`service→barber`):** `leavingStep=service`, la carcasa colapsa el card compacto de service (~60px) mientras `summaries` muestra la card de service animándose con `summary-in` (~0.1s después). Sin salto de altura.
- **Editar (click en summary, ej. `date→service`):** `setStep("service")` → `leavingStep=date`; la carcasa colapsa el card compacto de date y el form de service se re-expande. `buildSummary("date")` devuelve el resumen compacto porque `selectedDate`/`selectedSlot` persisten.
- **Success (`checkout→success`):** al pasar a `booking.step === "success"` se entra al bloque `success`; la carcasa no se renderiza ahí (el efecto solo setea `leavingStep` para pasos de `EDITABLE_STEPS`, `checkout` incluido, pero al renderizarse el bloque `success` la carcasa no aparece). Sin regresión.

## Verificación

- `npx tsc --noEmit` → **0 errores**.
- `npm run lint` → **sin errores nuevos**. Persisten 4 errores + 3 warnings pre-existentes (en `use-public-data.ts`, `use-tenant-name.ts`, `use-availability.ts` y el `<a href="/login">` en `BookingWizard.tsx:130`, ninguno introducido por esta iteración).
- `npm test -- --runInBand` → 8 suites pasan, 1 falla (`admin/services/page.test.tsx`, dashboard `ServicesPage`/`useToastManager`). Es **pre-existente y no relacionada**. No hay tests del wizard.
- No se rompió el dashboard ni la landing pública (solo se tocaron clases del wizard y el componente `BookingStepSummary`, que solo usa `BookingWizard`).

## Decisiones de implementación

- Se tipó `buildSummary` con `(typeof EDITABLE_STEPS)[number]` en lugar de `BookingStep`, ya que solo se invoca con pasos editables (nunca `success`).
- En la carcasa, `leavingSummary` se calcula una sola vez antes del `return` y se reutiliza (evita llamadas dobles a `buildSummary` en el JSX).
- Para el caso `leavingSummary === null` (paso editable sin datos) se renderiza un placeholder `<div />` mínimo dentro de `.landing-wizard-collapse` en vez de un form alto, cumpliendo la intención del plan.
- Se conservó `renderStepContent` sin cambios porque sigue siendo el renderer del paso activo; solo se dejó de usar para la carcasa.

## Problemas / desviaciones

- **Sin desviaciones funcionales** respecto al plan. Único matiz: el retardo de `summary-in` se fijó en `0.1s` (el plan indicaba ~0.1-0.15s); elige el valor mínimo del rango para no ralentizar la entrada del resumen. Ambos cumplen la intención.

## Estado

Completado.

---

# Sección de Auditoría — Auditor-agent

**Fecha:** 2026-08-18 · **Modo:** AUTO · **Fuente de verdad:** `.docs/` + plan del Planner + código.

## Veredicto general

**APROBADO** — La implementación ataca la causa raíz real (el colapso montaba el form alto del paso anterior). Ahora la carcasa colapsa solo el resumen compacto (~60px) extraído del contenido compartido de la card, eliminando el salto de altura. Se cumplen todas las restricciones: hook, steps, tipos, backend y landing intactos.

## Tabla de criterios

| # | Criterio | Estado | Evidencia (archivo:línea) |
|---|----------|--------|---------------------------|
| 1 | `BookingStepSummaryContent` extraído y exportado (inner sin `button`) | CUMPLE | `BookingStepSummary.tsx:21-46` — `export function BookingStepSummaryContent({label,value,meta})` con props `label/value/meta?`; `BookingStepSummary` lo envuelve en su `<button>` (`:48-58`). |
| 2 | `BookingStepSummary` mantiene API y `onClick` | CUMPLE | `BookingStepSummary.tsx:48-58` — firma `{label,value,meta,onClick}` intacta; `BookingStepSummaryProps` (:3-8) sin cambios. |
| 3 | Helper `buildSummary(step)` | CUMPLE | `BookingWizard.tsx:161-181` — service→name+price (`formatPrice`), barber→name, date→`fecha · hora`, checkout→null (default). |
| 4 | `summaries` refactorizado con `buildSummary` | CUMPLE | `BookingWizard.tsx:183-193` — `if (summary) summaries.push({step:s, ...summary})`; skip pasos `>= activeEditableIndex`. |
| 5 | Carcasa colapsa resumen compacto, NO el form alto | CUMPLE | `BookingWizard.tsx:343-356` — `leavingSummary` (:198-200) calculado con `buildSummary`; se renderiza `<BookingStepSummaryContent {...leavingSummary}/>` (:349-353) dentro de `.landing-wizard-collapse`; `renderStepContent(leavingStep)` eliminado de la carcasa. |
| 6 | Padding carcasa `p-4` + `aria-hidden/rounded-2xl/border/bg-card` | CUMPLE | `BookingWizard.tsx:344-346` — `aria-hidden` + `landing-wizard-form-exit rounded-2xl border border-border bg-card p-4 shadow-sm`. |
| 7 | `summary-in` con retardo tras fade+colapso | CUMPLE | `globals.css:414-416` — `animation-delay: 0.1s` en `.landing-wizard-summary-in`. |
| 8 | `prefers-reduced-motion` neutraliza | CUMPLE | `globals.css:651-665` — `animation:none` en `form`/`form-exit`/`summary-in`; `transition:none; grid-template-rows:0fr` en `.landing-wizard-collapse`. El delay no aplica bajo `animation:none`. |
| 9 | Hook `use-booking.ts` NO modificado | CUMPLE | `git diff HEAD -- frontend/src/hooks/booking/use-booking.ts` = 0 líneas. |
| 10 | Steps NO modificados | CUMPLE | `git diff HEAD -- frontend/src/components/booking/steps/` = 0 líneas. |
| 11 | Typecheck sin errores | CUMPLE | `npx tsc --noEmit` → exit 0 (verificado). |
| 12 | Flujo en ambas direcciones | CUMPLE | `BookingWizard.tsx:71-82` — `leavingStep` se fija para cualquier paso editable saliente; misma carcasa en avanzar y editar. |
| 13 | Success sin regresión (checkout→success) | CUMPLE | `BookingWizard.tsx:328-341` — ternario `booking.step === "success"` renderiza el bloque success y omite la carcasa/`summaries`. |
| 14 | Consistencia estética (easing + delay ADR-015/016) | CUMPLE | `globals.css:371,387,402,415` — easing `cubic-bezier(0.22,1,0.36,1)`; delay `0.1s`; alineado con la editorial de ADR-015/016 (keyframes gated por reduced-motion). |

## Fallas

No hay fallas de severidad CRÍTICA, ALTA ni MEDIA. Observación BAJA no bloqueante:

| Severidad | Archivo | Descripción | Corrección sugerida |
|-----------|---------|-------------|---------------------|
| BAJA | `BookingStepSummary.tsx` | El `group-hover:-translate-x-0.5` de "Editar" queda inerte cuando `BookingStepSummaryContent` se usa dentro de la carcasa (el contenedor no tiene clase `group`, y además `aria-hidden`). Impacto nulo: no es interactivo ahí. | Opcional: aceptar una prop para ocultar "Editar" en contexto no-botón. |

## Observaciones no bloqueantes

- La clase `group` vive ahora en el `<button>` de `BookingStepSummary`; el contenido extraído conserva el `group-hover` y lo usa correctamente cuando está envuelto por el botón.
- `renderStepContent` se mantiene (usado por el paso activo); la carcasa dejó de consumirlo. Sin código muerto.
- El placeholder `<div />` mínimo para `leavingSummary === null` preserva la semántica del colapso sin montar contenido alto.

## Conclusión

Se elimina la causa raíz del salto: la carcasa colapsa un resumen compacto (~60px) en vez del form alto del paso anterior. Morph form→card continuo, sin salto de altura, en ambas direcciones (avanzar y editar). Compilación en verde y sin errores de lint nuevos. Se **APRUEBA**.
