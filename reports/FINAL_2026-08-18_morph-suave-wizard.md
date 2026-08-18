# Reporte Técnico Final
## Eliminar el salto en el morph form→card del wizard de reserva (Iteración 2)

> **Generado:** 2026-08-18
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.12 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
> **Iteraciones realizadas:** 2
> **Veredicto final:** APROBADO

---

## Objetivo confirmado

Eliminar el salto hacia arriba al hacer click en "Continuar" o al editar una sección en el wizard de reserva (`/[slug]/reservar`), haciendo el morph form→card natural y armónico.

**Éxito cuando:**
- No hay salto brusco al transformar el form en card resumen.
- El colapso es suave y continuo.
- El scroll al cambiar de paso es natural.
- Se respeta `prefers-reduced-motion` y el estilo dark luxury.

**Fuera de alcance:** hook `useBooking`, steps del wizard, tipos, backend, otras vistas del dashboard.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | El usuario reportó que el salto persistía |
| 2         | APROBADO | — |

---

## Causa raíz del problema (iteración 1)

La iteración 1 implementó un colapso por `grid-template-rows` en la carcasa de salida, **pero la carcasa renderizaba el form COMPLETO del paso anterior** (`renderStepContent(leavingStep)`), que es ALTO (ej. `SelectService` con lista de servicios). Cuando ese form alto colapsaba a 0, la altura total de la sección bajaba bruscamente y el contenido de abajo (card resumen + form nuevo) subía de golpe → salto.

---

## Decisiones técnicas tomadas

### La carcasa colapsa el resumen compacto, no el form alto

**Qué se decidió:**
La carcasa de salida dejó de montar el form completo del paso anterior. Ahora colapsa solo el **resumen compacto** (~60px) del paso saliente, extraído del contenido compartido de la card (`BookingStepSummaryContent`).

**Por qué se tomó esta decisión:**
El salto venía de colapsar un form alto (~500px). Al colapsar un card compacto (~60px), el cambio de altura es mínimo y continuo → sin salto.

**Alternativas descartadas:**
- Mantener el form alto en la carcasa (iteración 1): causaba el salto.
- Medir altura con ref: más complejo y frágil.

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`BookingStepSummary.tsx` (extracción de contenido compartido), `BookingWizard.tsx` (helper `buildSummary` + carcasa con resumen compacto).

### Contenido compartido de la card reutilizable

**Qué se decidió:**
Se extrajo el inner de la card a `BookingStepSummaryContent` (label/value/meta, sin `button`), usado tanto por el botón clickeable `BookingStepSummary` como por la carcasa de salida.

**Por qué se tomó esta decisión:**
Garantiza que el resumen que colapsa en la carcasa sea **idéntico** al card apilado, para un morph continuo sin duplicados confusos.

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`BookingStepSummary.tsx`.

### Timing coordinado del morph

**Qué se decidió:**
El fade (0.3s) y el colapso (0.3s) de la carcasa terminan a la vez; el resumen apilado entra ~0.1s después (`animation-delay: 0.1s` en `.landing-wizard-summary-in`).

**Por qué se tomó esta decisión:**
La card saliente se "disuelve" mientras la entrante aparece en el mismo slot vertical → continuidad visual.

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`globals.css`.

---

## Mapa de cambios

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/components/booking/BookingStepSummary.tsx` | Extracción de `BookingStepSummaryContent` (inner sin `button`); `BookingStepSummary` lo envuelve en su `<button>` | Reutilizar el contenido de la card en la carcasa de salida |
| `frontend/src/components/booking/BookingWizard.tsx` | Helper `buildSummary(step)`; refactor de `summaries`; carcasa colapsa el resumen compacto en vez del form alto | Eliminar el salto de altura |
| `frontend/src/app/globals.css` | `animation-delay: 0.1s` en `.landing-wizard-summary-in` | Coordinar el timing del morph |

### Archivos eliminados

Ninguno.

---

## Cambios en archivos clave

### `frontend/src/components/booking/BookingWizard.tsx`

**Antes:** La carcasa de salida montaba `renderStepContent(leavingStep)` (el form completo del paso anterior, alto), que colapsaba causando el salto.

**Después:** La carcasa calcula `leavingSummary = buildSummary(leavingStep)` y renderiza `<BookingStepSummaryContent {...leavingSummary} />` (o un placeholder `<div/>` mínimo) dentro de `.landing-wizard-collapse`. Padding `p-4`. Ya no monta los steps.

**Por qué es importante:** Es el corazón del morph. La carcasa ahora colapsa un card compacto, eliminando el salto de altura.

### `frontend/src/components/booking/BookingStepSummary.tsx`

**Antes:** Todo el card (inner + button) en un solo componente.

**Después:** `BookingStepSummaryContent` (inner, sin button) exportado y reutilizable; `BookingStepSummary` lo envuelve en su `<button>`.

**Por qué es importante:** Permite que la carcasa muestre el mismo card que el summary apilado, para un morph continuo.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| `BookingStepSummaryContent` extraído y exportado | Cumplido | `BookingStepSummary.tsx:21-46` |
| `BookingStepSummary` mantiene API y `onClick` | Cumplido | `BookingStepSummary.tsx:48-58` |
| Helper `buildSummary(step)` | Cumplido | `BookingWizard.tsx:161-181` |
| Carcasa colapsa resumen compacto, NO el form alto | Cumplido | `BookingWizard.tsx:343-356` |
| Padding carcasa `p-4` + `aria-hidden/rounded-2xl/border/bg-card` | Cumplido | `BookingWizard.tsx:344-346` |
| `summary-in` con retardo tras fade+colapso | Cumplido | `globals.css:414-416` |
| `prefers-reduced-motion` neutraliza | Cumplido | `globals.css:651-665` |
| Hook `use-booking.ts` no modificado | Cumplido | `git diff` vacío |
| Steps no modificados | Cumplido | `git diff` vacío |
| Typecheck sin errores | Cumplido | `npx tsc --noEmit` → exit 0 |
| Flujo en ambas direcciones (avanzar y editar) | Cumplido | `BookingWizard.tsx:71-82` |
| Success sin regresión | Cumplido | `BookingWizard.tsx:328-341` |
| Consistencia estética (easing + delay ADR-015/016) | Cumplido | `globals.css:371,387,402,415` |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | El `group-hover:-translate-x-0.5` de "Editar" queda inerte cuando `BookingStepSummaryContent` se usa en la carcasa (no es interactivo ahí). Impacto nulo. | BAJA | `BookingStepSummary.tsx` | Opcional (aceptar prop para ocultar "Editar" en contexto no-botón) |

---

## Lo que el programador debe saber

- **Salto eliminado:** el salto hacia arriba al hacer click en "Continuar" o al editar una sección fue corregido. La causa era que la carcasa colapsaba el form completo del paso anterior (alto); ahora colapsa solo el resumen compacto (~60px).
- **Morph continuo:** el form se transforma en el card resumen de forma suave y armónica, en ambas direcciones (avanzar y editar).
- **Convención:** el contenido de la card vive en `BookingStepSummaryContent` (reutilizable); `BookingStepSummary` es el botón clickeable. Mantener esta separación.
- **No se tocó** el hook `useBooking`, los steps, los tipos ni el backend.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-18_morph-suave-wizard_iter1.md` |
| 2         | `reports/2026-08-18_morph-suave-wizard_iter2.md` |