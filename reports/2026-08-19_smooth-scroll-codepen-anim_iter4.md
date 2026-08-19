# Reporte Iter 4 — Fix salto de cards en wizard de reserva

Fecha: 2026-08-19

## Resumen del cambio

Se corrigió un bug visual en `frontend/src/components/booking/BookingWizard.tsx`: al avanzar de paso, el card del paso completado aparecía ENCIMA del card anterior y luego se reordenaba (salto raro).

### Causa
La "carcasa de salida" del morph form→card (bloque `{leavingStep && ...}`) se renderizaba PRIMERO (arriba del stack), ANTES de las cards resumen. Como esa carcasa muestra el resumen del paso que está saliendo, aparecía encima del card 1 y luego, al colapsar, se reordenaba con el card 2 que se añadía a `summaries`.

### Corrección
Se movió el bloque `{leavingStep && ...}` al FINAL del stack: DESPUÉS de `summaries.map(...)` y ANTES del form del paso activo.

De esta forma, la carcasa colapsa en el lugar donde estaba el form (abajo), y el card 2 aparece debajo del card 1 sin reordenarse — los cards se apilan en orden: card 1 arriba, card 2 debajo, etc.

Solo se movió el bloque de posición. NO se modificó su contenido interno ni la lógica de `leavingStep` / `closing` / `leavingSummary`. NO se tocó el CSS.

## Verificación

Desde `/home/eduardo/trimflow/frontend`:

1. **`npm run lint`** — Sin errores NUEVOS introducidos por este cambio. El único error en `BookingWizard.tsx` (línea 159, uso de `<a>` en lugar de `<Link />`) es preexistente: se confirmó con `git stash` que aparece también sin el cambio. (Hay otros 3 errores preexistentes en `use-public-data.ts` y `use-tenant-name.ts`, ajenos a este trabajo.)
2. **`npx tsc --noEmit`** — Sin errores de tipos.
3. **Dev server (:3001)** — Responde con HTTP 307 (redirect normal), sin errores de compilación.

---

# Auditoría — Iteración 4

**Auditor:** Agente Auditor (ORCHESTRATOR / AUTO)
**Fuente de verdad:** `.docs/requirements/mvp-scope.md`, `.docs/architecture/modules.md`, `.docs/decisions/` (ADR-012/014/015/016), plan FINAL `reports/FINAL_2026-08-19_smooth-scroll-codepen-anim.md`
**Fecha:** 2026-08-19

## 1. Criterios evaluados

| # | Criterio | Resultado |
|---|----------|-----------|
| C1 | Orden del stack corregido: (1) `summaries.map`, (2) carcasa `leavingStep`, (3) form del paso activo | ✅ CUMPLE |
| C2 | Contenido interno de la carcasa `leavingStep` intacto (no se cambió su JSX ni clases) | ✅ CUMPLE |
| C3 | Lógica de `leavingStep` / `closing` / `leavingSummary` / `isStepTransition` intacta | ✅ CUMPLE |
| C4 | Sin cambios fuera de alcance (CSS, backend, `useBooking`, steps, dashboards, `.docs`) | ✅ CUMPLE |
| C5 | Compilación: `tsc --noEmit` y `lint` sin errores NUEVOS | ✅ CUMPLE |
| C6 | Causa raíz y corrección descritas en el reporte coinciden con el código | ✅ CUMPLE |

## 2. Evidencia

### C1 — Orden del stack
- `BookingWizard.tsx:372-381` — `summaries.map(...)` PRIMERO (cards resumen apiladas arriba).
- `BookingWizard.tsx:383-396` — bloque `{leavingStep && ...}` (carcasa de salida) AHORA en el medio, después de `summaries.map` y antes del form.
- `BookingWizard.tsx:398-406` — form del paso activo (`key={booking.step}`) al final.

`git diff` confirma el movimiento puro: en HEAD el orden era `leavingStep` → `summaries.map` → form; ahora es `summaries.map` → `leavingStep` → form. 11 inserciones / 11 borrados, todos dentro del bloque reordenado. ✅

### C2 — Contenido interno de la carcasa intacto
- `BookingWizard.tsx:384-386` — `aria-hidden` + `className="landing-wizard-form-exit rounded-2xl border border-border bg-card p-4 shadow-sm"` idéntico a HEAD.
- `BookingWizard.tsx:388` — `cn("landing-wizard-collapse", closing && "is-closing")` idéntico.
- `BookingWizard.tsx:389-393` — ternario `leavingSummary ? <BookingStepSummaryContent {...leavingSummary} /> : <div />` idéntico.
- El diff no muestra ninguna modificación de contenido dentro del bloque; solo su posición. ✅

### C3 — Lógica intacta
- `BookingWizard.tsx:56` — `leavingStep` state, `57` — `prevStepRef`, `62` — `isStepTransition`, `66` — `closing`.
- `BookingWizard.tsx:68-74` — efecto `closing` (doble rAF) intacto.
- `BookingWizard.tsx:76-87` — efecto de cambio de paso + timeout 300ms intacto.
- `BookingWizard.tsx:91-95` — efecto de limpieza de `isStepTransition` (1300ms) intacto.
- `BookingWizard.tsx:100-111` — `handleNext`/`handlePrev`/`handleSetStep` intactos.
- `BookingWizard.tsx:227-229` — `leavingSummary` intacto; `190-210` — `buildSummary` intacto.
- El diff no toca ninguna de estas líneas. ✅

### C4 — Fuera de alcance
- `git diff --name-only HEAD` — solo `frontend/src/components/booking/BookingWizard.tsx`. No hay cambios en `*.css`, backend, `use-booking.ts`, `steps/`, dashboards ni `.docs/`. ✅

### C5 — Compilación
- `npx tsc --noEmit` en `frontend/` — **0 errores** (exit 0).
- `npm run lint` en `frontend/` — **7 problemas (4 errors, 3 warnings)**, todos preexistentes y en archivos no tocados por esta iteración:
  - `BookingWizard.tsx:159` — `no-html-link-for-pages` (`<a href="/login">`), confirmado preexistente: existe en HEAD en la misma línea 159 (`git show HEAD`).
  - `use-availability.ts:20`, `use-public-data.ts:37`, `use-tenant-name.ts:27` — `react-hooks/set-state-in-effect`, en hooks no modificados (último commit que los tocó: `71b01bc`, anterior a esta iteración).
  - 3 warnings de `no-img-element` en `admin/landing/page.tsx` y `LandingGallery.tsx`, preexistentes. ✅

### C6 — Causa raíz y corrección coinciden con el código
- El reporte describe que la carcasa se renderizaba PRIMERO (arriba del stack); el diff de HEAD confirma ese orden original (`leavingStep` antes de `summaries.map`).
- El reporte describe que la carcasa ahora colapsa donde estaba el form y el card 2 se apila debajo del card 1; el orden actual (`summaries.map` → `leavingStep` → form) lo garantiza. ✅

## 3. Alineación con `.docs`
- `mvp-scope.md:59` — flujo en 4 pasos + confirmación: intacto.
- `modules.md:256` — `booking/` (BookingWizard + ReservationPage): intacto; el cambio es puramente presentacional (orden de render de bloques JSX).
- ADR-012/014 — el wizard se reutiliza en `/[slug]/reservar`; no se alteró el flujo ni la lógica de reserva.
- ADR-015:13 ("NO se toca la lógica de reservas") — cumplido: solo se reordenó un bloque de presentación.
- Plan FINAL (`reports/FINAL_2026-08-19_smooth-scroll-codepen-anim.md`) — "Fuera de alcance: backend, `useBooking`, steps, dashboards" respetado; los criterios de éxito del morph form→card se conservan y el reorden de cards queda corregido.

## 4. Veredicto por criterio
Todos los criterios (C1–C6) **CUMPLEN**. No se detectan fallas bloqueantes.

---

VEREDICTO: APROBADO CON OBSERVACIONES
FALLAS: ninguna
OBSERVACIONES:
- Precisión menor del reporte: afirma "otros 3 errores preexistentes en `use-public-data.ts` y `use-tenant-name.ts`", pero los 3 errores `set-state-in-effect` se distribuyen en 3 archivos: `use-availability.ts:20`, `use-public-data.ts:37` y `use-tenant-name.ts:27` (todos preexistentes y fuera del alcance; no afecta el veredicto).
- Aspecto de diseño preexistente (no introducido por esta iteración): durante los 300ms de la transición, el resumen del paso que sale aparece dos veces en el stack (una vez como card en `summaries.map` y otra dentro de la carcasa que colapsa, `aria-hidden`). Es inherente al mecanismo de morph y no es una regresión de esta iteración.
- El fix resuelve el síntoma reportado (card del paso completado encima del card anterior + reorden), pero la confirmación visual en dispositivo real sigue pendiente, igual que en iteraciones previas.