# Reporte Técnico Final
## Smooth scroll mobile + animación CodePen en el wizard de reserva

> **Generado:** 2026-08-19
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.12 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

- **(A)** Corregir el smooth scroll en mobile (hoy "se va para cualquier lado") manteniendo el buen comportamiento en desktop, con enfoque en la landing pública.
- **(B)** Implementar en el wizard de reserva la animación del CodePen *"Step by step register form"* de JeromeRenders, **adaptada** al lenguaje visual del proyecto (tokens shadcn, ADR-015/016). La diferencia con el CodePen: al completar un paso, el form desaparece y se convierte en una card resumen con lo seleccionado.

**Éxito cuando:**
- Anclas de la landing (`#servicios`, `#equipo`, `#horarios`, `#ubicacion`) deslizan suavemente en desktop.
- En mobile el scroll ya no "se va para cualquier lado": anclas y scroll a top se comportan de forma correcta y predecible.
- El form del paso activo entra con `scale(0.2 → 1.1 → 1)` + fade (overshoot al 60%).
- Al completar un paso, el form sale con `translateY(120px) + scale(0.9)` + fade y se convierte en card resumen.
- `prefers-reduced-motion` respetado.
- No se rompen las animaciones/estilos existentes de la landing (ADR-015/016).

**Fuera de alcance:** backend, hook `useBooking` (lógica de negocio), steps del wizard, tipos, dashboards, validación del CodePen.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | Ninguna (solo observaciones BAJA no bloqueantes) |

---

## Decisiones técnicas tomadas

### Smooth scroll por JS dirigido en lugar de `scroll-behavior: smooth` global

**Qué se decidió:**
Eliminar el `html { scroll-behavior: smooth }` global y reemplazarlo por un helper JS (`smooth-scroll.ts`) que hace `scrollIntoView`/`window.scrollTo` con `behavior: "smooth"` solo cuando la UI lo pide, respetando `prefers-reduced-motion`.

**Por qué se tomó esta decisión:**
El `scroll-behavior: smooth` global sobre `html` es el culpable del scroll errático en mobile (bug conocido en iOS Safari): al existir smooth sobre `html`, los `scrollIntoView`/`window.scrollTo` y los saltos de ancla se "compiten", produciendo el "se va para cualquier lado". Al hacer el scroll explícito y dirigido por JS, se elimina el comportamiento errático y se mantiene el deslizamiento suave en desktop.

**Alternativas descartadas:**
- Mantener `scroll-behavior: smooth` global (causa del bug en mobile).
- Librerías de smooth scroll (Lenis/Locomotive): innecesarias, JS nativo basta.

**Impacto en .docs:**
Ninguno. Refuerza el aislamiento landing/dashboard de ADR-013 (el smooth ya no es global).

**Impacto en el código:**
`globals.css` (se elimina la regla global), nuevo `lib/smooth-scroll.ts`, `LandingNav.tsx`, `ScrollToTopButton.tsx`, `use-booking.ts`.

### Animación del CodePen adaptada al lenguaje editorial (ADR-015/016)

**Qué se decidió:**
Replicar la animación del CodePen (entrada `scale(0.2→1.1→1)` + fade con overshoot al 60%; salida `translateY(120px)+scale(0.9)` + fade) pero con el easing editorial del proyecto `cubic-bezier(0.22, 1, 0.36, 1)` y duraciones cortas, sin los iconos CSS ni la validación/shake del CodePen (el wizard ya valida).

**Por qué se tomó esta decisión:**
El usuario pidió la animación del CodePen adaptada a nuestro código. El wizard ya tenía un morph form→card; se sustituyó la animación de entrada/salida por la del CodePen manteniendo la mecánica de cards apiladas existente.

**Alternativas descartadas:**
- Copiar literalmente el CSS del CodePen (rompería el lenguaje ADR-015/016 y los tokens shadcn).
- Añadir la validación/shake del CodePen (redundante con la validación del wizard).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`globals.css` — keyframes `landing-wizard-step-in` y `landing-wizard-step-out` reemplazan a `landing-wizard-in`/`landing-wizard-exit-fade`. `BookingWizard.tsx` no se tocó (su `key={booking.step}`, `leavingStep` y timeout de 300ms ya sincronizan con las nuevas duraciones).

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `frontend/src/lib/smooth-scroll.ts` | Helper JS de smooth scroll (`smoothScrollToSection` / `smoothScrollToTop`) que respeta `prefers-reduced-motion` | Smooth scroll por JS dirigido en lugar de CSS global |
| `reports/2026-08-19_smooth-scroll-codepen-anim_iter1.md` | Reporte de ejecución y auditoría de la iteración 1 | — |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/app/globals.css` | Eliminado `html { scroll-behavior: smooth }`; keyframes del wizard reemplazados por `landing-wizard-step-in` (scale) y `landing-wizard-step-out` (translateY+scale) | Corregir scroll mobile; implementar animación CodePen |
| `frontend/src/components/landing/LandingNav.tsx` | Anclas desktop y móvil usan `smoothScrollToSection`; logo usa `smoothScrollToTop` | Smooth scroll dirigido por JS |
| `frontend/src/components/landing/ScrollToTopButton.tsx` | Usa `smoothScrollToTop` | Smooth scroll dirigido por JS |
| `frontend/src/hooks/booking/use-booking.ts` | `setStep` usa `smoothScrollToTop` (solo línea 47) | Evitar scroll errático al cambiar de paso en mobile |

### Archivos eliminados

Ninguno.

---

## Cambios en archivos clave

### `frontend/src/app/globals.css`

**Antes:** `html { scroll-behavior: smooth }` global (causa del bug en mobile); entrada del wizard con fade+translateY; salida con fade+colapso.
**Después:** Sin smooth global; entrada con `scale(0.2→1.1→1)`+fade (0.5s, easing editorial); salida con `translateY(120px)+scale(0.9)`+fade (0.3s ease-in).
**Por qué es importante:** Define el comportamiento de scroll global y la animación del wizard. Debe respetar `prefers-reduced-motion` y el lenguaje editorial de ADR-015/016.

### `frontend/src/lib/smooth-scroll.ts` (nuevo)

**Antes:** no existía.
**Después:** Helper `"use client"` con `smoothScrollToSection(id)` (usa `scrollIntoView` con `scroll-margin-top` para el offset de la navbar) y `smoothScrollToTop()`. Ambos respetan `prefers-reduced-motion`.
**Por qué es importante:** Es el único punto de scroll suave de la landing. Centraliza el comportamiento y evita el scroll errático en mobile.

### `frontend/src/components/landing/LandingNav.tsx`

**Antes:** anclas con `href="#id"` (dependían del `scroll-behavior: smooth` global) y `window.scrollTo({behavior:"smooth"})` en el logo.
**Después:** anclas con `onClick` que hace `preventDefault()` + `smoothScrollToSection`; logo con `smoothScrollToTop`. El menú móvil conserva `setOpen(false)`.
**Por qué es importante:** Es el nav de la landing; si se modifica sin entender el flujo se puede romper la navegación por anclas.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Anclas smooth en desktop | Cumplido | `LandingNav.tsx:84-101,141-158` + `scroll-margin-top:64px` en `globals.css:280-285` |
| Mobile sin saltos erráticos | Cumplido (estático) | `html { scroll-behavior:smooth }` eliminado; únicos scrolls vía helper |
| Entrada `scale(0.2→1.1→1)` overshoot 60% | Cumplido | `globals.css:363-370` |
| Salida `translateY(120px)+scale(0.9)` → card | Cumplido | `globals.css:374-380` + clases en `BookingWizard.tsx:346,359,371` |
| `prefers-reduced-motion` respetado | Cumplido | `smooth-scroll.ts:3-5` + `globals.css:635-649` |
| Sin romper ADR-015/016/013 | Cumplido | Easing editorial conservado; aislamiento landing/dashboard intacto |
| Compilación sin errores nuevos | Cumplido | `npx tsc --noEmit` → exit 0; lint: 7 problemas preexistentes, cero nuevos |
| Alcance respetado (no se tocó backend/dashboards/.docs) | Cumplido | `git diff` verificado |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | `html { scroll-behavior: auto }` en el bloque `prefers-reduced-motion` quedó redundante tras eliminar el smooth global | BAJA | `globals.css:622-625` | Limpiable en futura iteración |
| 2 | El criterio "mobile sin saltos" se verificó estáticamente; conviene confirmarlo en dispositivo móvil real | BAJA | — | Confirmar manualmente |
| 3 | El reporte de ejecución enumeró solo 2 archivos con lint preexistente; en realidad son 6 (conclusión correcta, enumeración incompleta) | BAJA | — | No requiere acción |

---

## Lo que el programador debe saber

- **Smooth scroll mobile corregido:** se eliminó el `scroll-behavior: smooth` global (culpable del bug en iOS Safari) y se reemplazó por un helper JS dirigido (`smooth-scroll.ts`). Los anclas de la landing y el scroll a top ahora usan `scrollIntoView`/`window.scrollTo` con smooth solo cuando la UI lo pide, respetando `prefers-reduced-motion`. Esto también deja de afectar a los dashboards (refuerza ADR-013).
- **Animación del CodePen adaptada:** el form del paso activo del wizard entra con `scale(0.2→1.1→1)` + fade (overshoot al 60%), y al completar un paso sale con `translateY(120px)+scale(0.9)` + fade convirtiéndose en la card resumen con lo seleccionado. Se mantuvo el easing editorial `cubic-bezier(0.22,1,0.36,1)` y los tokens shadcn.
- **No se tocó** `BookingWizard.tsx` (su lógica de `key`/`leavingStep`/timeout ya sincroniza con las nuevas animaciones), ni el hook `useBooking` en su lógica de negocio (solo se cambió el scroll de `setStep`), ni backend, ni dashboards, ni `.docs`.
- **Convención nueva:** todo scroll suave de la landing debe pasar por `@/lib/smooth-scroll` (`smoothScrollToSection` / `smoothScrollToTop`), no por `window.scrollTo` directo ni CSS global. Mantener esta convención en futuros cambios.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-19_smooth-scroll-codepen-anim_iter1.md` |