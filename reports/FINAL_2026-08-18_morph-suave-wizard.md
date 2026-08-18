# Reporte Técnico Final
## Morph suave form→card en el wizard de reserva

> **Generado:** 2026-08-18
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.12 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

Corregir el "salto" y hacer más natural/armonioso el morph form→card en el wizard de reserva (`/[slug]/reservar`).

**Éxito cuando:**
- No hay salto brusco al transformar el form en card resumen.
- El colapso del form es suave y continuo (sin recorte brusco).
- El scroll al cambiar de paso es natural, no "muy rápido".
- Se respeta `prefers-reduced-motion` y el estilo dark luxury.

**Fuera de alcance:** hook `useBooking`, steps del wizard, tipos, backend, otras vistas del dashboard.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | Ninguna (solo 2 fallas BAJA no bloqueantes) |

---

## Causa raíz del problema

El "salto" al avanzar/quitar un paso en el wizard se debía a **tres causas**:

1. **`max-height: 1000px → 0`** en la animación de salida `.landing-wizard-out`: `max-height` no es animable de forma suave — el navegador recorta el contenido bruscamente cuando el `max-height` baja de la altura real, y al final el contenido de abajo (el form nuevo) sube de golpe.
2. **La carcasa `.landing-wizard-form-exit` era un `<div>` VACÍO**: como el form real se desmontaba instantáneamente por el `key={booking.step}`, el `max-height` sobre la carcasa vacía no colapsaba contenido real — la altura del form desaparecía de golpe.
3. **`window.scrollTo({top:0, behavior:"smooth"})`** del hook `useBooking` (en `setStep`) combinado con la animación producía el efecto de "scroll rápido + salto".

---

## Decisiones técnicas tomadas

### Colapso por `grid-template-rows` (1fr → 0fr) en lugar de `max-height`

**Qué se decidió:**
Reemplazar el hack `max-height: 1000px → 0` por una transición de `grid-template-rows: 1fr → 0fr` con `overflow: hidden` y `min-height: 0` en un contenedor `.landing-wizard-collapse`.

**Por qué se tomó esta decisión:**
`grid-template-rows` es la técnica moderna para colapsar contenido suavemente sin conocer la altura real. Es agnóstica a la altura y anima de forma continua, eliminando el recorte brusco del `max-height`.

**Alternativas descartadas:**
- Medir la altura real con `ref` y animar `height`: más complejo y frágil ante cambios de contenido.
- Mantener `max-height`: causa raíz del problema, no animable suavemente.

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`globals.css` (`.landing-wizard-collapse`) y `BookingWizard.tsx` (carcasa con contenido real).

### La carcasa de salida envuelve el contenido real del paso saliente

**Qué se decidió:**
La carcasa `.landing-wizard-form-exit` dejó de ser un `<div>` vacío y ahora envuelve `renderStepContent(leavingStep)` dentro de `.landing-wizard-collapse`, de modo que la altura del form saliente se colapsa de forma continua (sin desmontaje instantáneo).

**Por qué se tomó esta decisión:**
El form real se desmontaba instantáneamente por el `key={booking.step}`, por lo que la altura desaparecía de golpe. Al mantener el contenido montado durante la salida, el colapso es continuo y el form entrante se cruza de forma armónica (morph real).

**Alternativas descartadas:**
- Carcasa vacía (estado anterior): no colapsaba contenido real, causaba el salto.

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`BookingWizard.tsx` (extracción de `renderStepContent` + carcasa con contenido).

### Coordinación del scroll sin tocar el hook

**Qué se decidió:**
No añadir JS para interceptar scroll. Se alineó la duración del colapso (~0.3s) con el desplazamiento suave nativo del navegador, de modo que la altura de la página cambia suavemente mientras el scroll asciende y ambos terminan juntos.

**Por qué se tomó esta decisión:**
El hook `useBooking` está restringido (solo lectura). El colapso por grid mantiene el contenido montado, evitando la caída instantánea de altura que el `scrollTo` amplificaba.

**Alternativas descartadas:**
- Editar el hook para consultar `matchMedia('(prefers-reduced-motion: reduce)')`: fuera de alcance (hook congelado).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`globals.css` (duraciones alineadas).

---

## Mapa de cambios

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/components/booking/BookingWizard.tsx` | Extracción de `renderStepContent`; carcasa de salida con contenido real; estado/efecto `closing` con doble rAF | Implementar el colapso continuo del form saliente |
| `frontend/src/app/globals.css` | Colapso por grid en `.landing-wizard-collapse`; nuevo `@keyframes landing-wizard-exit-fade`; ajuste `prefers-reduced-motion` | Eliminar el `max-height` no animable y animar el colapso suavemente |

### Archivos eliminados

Ninguno.

---

## Cambios en archivos clave

### `frontend/src/components/booking/BookingWizard.tsx`

**Antes:** La carcasa de salida era un `<div>` vacío con `max-height` que no colapsaba contenido real; el form se desmontaba instantáneamente por el `key={booking.step}`.

**Después:** El switch del form se extrajo a `renderStepContent(step)`. La carcasa `.landing-wizard-form-exit` envuelve `renderStepContent(leavingStep)` dentro de `.landing-wizard-collapse` (con clase `is-closing` condicional). El estado `closing` se dispara con doble `requestAnimationFrame` tras el montaje, iniciando el colapso suave por grid.

**Por qué es importante:** Es el corazón del morph. Si se modifica sin entender el flujo, se puede romper la acumulación de cards o el re-expandir de pasos.

### `frontend/src/app/globals.css`

**Antes:** `@keyframes landing-wizard-out` con `max-height: 1000px → 0` (no animable suavemente).

**Después:** `@keyframes landing-wizard-exit-fade` (solo fade, 0.3s) + `.landing-wizard-collapse` con `grid-template-rows: 1fr → 0fr` y `transition` 0.3s. `prefers-reduced-motion` neutraliza todo.

**Por qué es importante:** Define el colapso suave del form. Debe respetar `prefers-reduced-motion` y el lenguaje editorial de ADR-015/016.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Helper `renderStepContent` reutilizable | Cumplido | `BookingWizard.tsx:184-250` |
| Carcasa con contenido real (no div vacío) | Cumplido | `BookingWizard.tsx:325-334` |
| Colapso por grid (sin max-height) | Cumplido | `globals.css:397-409` |
| Estado `closing` con doble rAF | Cumplido | `BookingWizard.tsx:61-69` |
| key={booking.step} conservado | Cumplido | `BookingWizard.tsx:348` |
| prefers-reduced-motion neutraliza la técnica | Cumplido | `globals.css:648-662` |
| Hook useBooking no modificado | Cumplido | `git diff` vacío |
| Steps no modificados | Cumplido | `git diff` vacío |
| Compilación sin errores nuevos | Cumplido | `npx tsc --noEmit` → exit 0 |
| Consistencia estética (easing + tokens ADR-015/016) | Cumplido | `cubic-bezier(0.22,1,0.36,1)` |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | El cleanup del efecto de rAF solo cancela el frame externo; si `leavingStep` cambia antes del rAF interno, `setClosing(true)` podría ejecutarse sobre una carcasa a punto de desmontarse. Impacto nulo en la práctica. | BAJA | `BookingWizard.tsx:63-69` | Refinamiento futuro (cancelar ambos frames o usar flag `cancelled`) |
| 2 | `window.scrollTo({ behavior: "smooth" })` del hook sobrescribe la `scroll-behavior: auto` de reduced-motion (es JS). | BAJA | `use-booking.ts:47` | Futura iteración (consultar `matchMedia`) — hook congelado |

---

## Lo que el programador debe saber

- **Morph suave:** el "salto" al transformar el form en card resumen fue corregido. Ahora el form del paso completado se colapsa de forma continua (colapso por grid, sin recorte brusco) mientras la card resumen se apila y el nuevo form aparece debajo.
- **Scroll natural:** el scroll al cambiar de paso es más natural; la duración del colapso se alineó con el desplazamiento suave nativo.
- **Convención:** el colapso usa `grid-template-rows` (no `max-height`), que es la técnica correcta para animar colapsos suavemente. Mantener esta convención en futuros cambios.
- **No se tocó** el hook `useBooking`, los steps, los tipos ni el backend.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-18_morph-suave-wizard_iter1.md` |