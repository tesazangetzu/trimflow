# Reporte Técnico Final
## Smooth scroll mobile + animación CodePen en el wizard de reserva

> **Generado:** 2026-08-19
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.12 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
> **Iteraciones realizadas:** 3
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
| 2         | APROBADO | Ninguna |
| 3         | APROBADO CON OBSERVACIONES | Ninguna (solo observaciones BAJA no bloqueantes) |

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

### Menú móvil como overlay con fondo sólido (iteración 2)

**Qué se decidió:**
Convertir el panel móvil de la hamburguesa en un overlay absoluto (`position: absolute; top: 100%`) anclado bajo el nav, con fondo sólido `var(--landing-bg)` (sin transparencia), en lugar de estar en flujo normal dentro del nav.

**Por qué se tomó esta decisión:**
El panel en flujo normal expandía el nav al abrirse, empujando el contenido de la página hacia abajo. El usuario pidió que el menú siempre esté por encima de la página (overlay) y sin transparencia en mobile.

**Alternativas descartadas:**
- Mantener el panel en flujo normal (causa del problema).
- Fondo translúcido con blur (el usuario pidió sin transparencia).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`globals.css` — `.landing-nav-panel` como overlay absoluto con fondo sólido; reglas `.landing-nav.is-open` / `.is-open.is-scrolled` con fondo sólido.

### Smooth scroll sin overshoot en mobile (iteración 2)

**Qué se decidió:**
Reemplazar `scrollIntoView` por cálculo manual de la posición Y absoluta (`getBoundingClientRect().top + window.scrollY - NAV_OFFSET`) con `window.scrollTo`, fijando el target una sola vez.

**Por qué se tomó esta decisión:**
`scrollIntoView` re-resuelve el target sobre un viewport que cambia de altura en mobile (colapso/expansión de la URL bar), causando overshoot (el scroll aterrizaba más abajo del título). El cálculo manual fija la posición absoluta, independiente de la altura del viewport.

**Alternativas descartadas:**
- Mantener `scrollIntoView` (causa del overshoot en mobile).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`lib/smooth-scroll.ts` — `smoothScrollToSection` con `NAV_OFFSET = 64` (coincide con `scroll-margin-top`).

### Secuencia de animación del wizard (iteración 3)

**Qué se decidió:**
Secuenciar la animación del wizard al avanzar de paso: primero sale el form del paso completado (`step-out`), luego entra el card resumen (`summary-in`), y por último entra el siguiente paso (`step-in`). Se logra con retardos CSS y un estado `isStepTransition` que se setea síncronamente antes del cambio de paso.

**Por qué se tomó esta decisión:**
El usuario pidió que la animación fuera paso a paso (no todo a la vez). El retardo del siguiente form solo debe aplicarse en transiciones, no en el montaje inicial, por lo que se controla con un estado que se setea en los wrappers de cambio de paso.

**Alternativas descartadas:**
- Leer el ref `prevStepRef` durante el render (rompía lint `react-hooks/refs`).
- Retardo CSS global en el form (retrasaría también el montaje inicial).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`globals.css` — `.landing-wizard-form--delayed { animation-delay: 0.75s }`; retardo de `summary-in` a 0.3s. `BookingWizard.tsx` — estado `isStepTransition` + wrappers `handleNext`/`handlePrev`/`handleSetStep`.

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
| `frontend/src/app/globals.css` | Eliminado `html { scroll-behavior: smooth }`; keyframes del wizard reemplazados por `landing-wizard-step-in` (scale) y `landing-wizard-step-out` (translateY+scale); `.landing-nav-panel` como overlay absoluto con fondo sólido; `.landing-wizard-form--delayed` (delay 0.75s); retardo de `summary-in` a 0.3s | Corregir scroll mobile; implementar animación CodePen; menú overlay; secuencia de animación |
| `frontend/src/components/landing/LandingNav.tsx` | Anclas desktop y móvil usan `smoothScrollToSection`; logo usa `smoothScrollToTop` | Smooth scroll dirigido por JS |
| `frontend/src/components/landing/ScrollToTopButton.tsx` | Usa `smoothScrollToTop` | Smooth scroll dirigido por JS |
| `frontend/src/hooks/booking/use-booking.ts` | `setStep` usa `smoothScrollToTop` (solo línea 47) | Evitar scroll errático al cambiar de paso en mobile |
| `frontend/src/components/booking/BookingWizard.tsx` | Estado `isStepTransition` + wrappers `handleNext`/`handlePrev`/`handleSetStep` que setean el retardo síncronamente; clase `landing-wizard-form--delayed` condicional | Secuenciar la animación (sale form → entra card → entra siguiente paso) |

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
| 3 | Las secciones conservan `scroll-mt-24` (96px) compensado por el selector `#id { scroll-margin-top: 64px }`; limpiable quitando `scroll-mt-24` | BAJA | `LandingSections.tsx` | Limpiable en futura iteración |
| 4 | Comentario desactualizado en `globals.css` (~0.1s) que no refleja el nuevo retardo 0.3s de `summary-in` | BAJA | `globals.css` | Cosmético |
| 5 | Edge case: dos avances en rápida sucesión (<1300ms) apagan `isStepTransition` algo antes del fin de la segunda entrada; no observable en práctica normal | BAJA | `BookingWizard.tsx` | No requiere acción |

---

## Lo que el programador debe saber

- **Smooth scroll mobile corregido:** se eliminó el `scroll-behavior: smooth` global (culpable del bug en iOS Safari) y se reemplazó por un helper JS dirigido (`smooth-scroll.ts`). Los anclas de la landing y el scroll a top ahora usan `scrollIntoView`/`window.scrollTo` con smooth solo cuando la UI lo pide, respetando `prefers-reduced-motion`. Esto también deja de afectar a los dashboards (refuerza ADR-013).
- **Overshoot en mobile corregido:** `smoothScrollToSection` calcula la posición Y absoluta una sola vez (`getBoundingClientRect().top + scrollY - 64`), evitando la deriva por el colapso de la URL bar en mobile. Los anclas aterrizan justo bajo la navbar.
- **Menú móvil como overlay:** el panel de la hamburguesa ya no empuja la página hacia abajo; es un overlay absoluto con fondo sólido (sin transparencia) que siempre queda por encima del contenido.
- **Animación del CodePen adaptada:** el form del paso activo del wizard entra con `scale(0.2→1.1→1)` + fade (overshoot al 60%), y al completar un paso sale con `translateY(120px)+scale(0.9)` + fade convirtiéndose en la card resumen con lo seleccionado. Se mantuvo el easing editorial `cubic-bezier(0.22,1,0.36,1)` y los tokens shadcn.
- **Secuencia de animación:** al avanzar de paso, la animación es secuencial: primero sale el form del paso completado, luego entra el card resumen, y por último entra el siguiente paso. El retardo del siguiente form solo se aplica en transiciones (no en el montaje inicial).
- **No se tocó** el hook `useBooking` en su lógica de negocio (solo se cambió el scroll de `setStep`), ni backend, ni dashboards, ni `.docs`.
- **Convención nueva:** todo scroll suave de la landing debe pasar por `@/lib/smooth-scroll` (`smoothScrollToSection` / `smoothScrollToTop`), no por `window.scrollTo` directo ni CSS global. Mantener esta convención en futuros cambios.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-19_smooth-scroll-codepen-anim_iter1.md` |
| 2         | `reports/2026-08-19_smooth-scroll-codepen-anim_iter2.md` |
| 3         | `reports/2026-08-19_smooth-scroll-codepen-anim_iter3.md` |