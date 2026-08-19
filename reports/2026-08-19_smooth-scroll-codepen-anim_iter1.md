# Reporte — Smooth Scroll Mobile + Animación CodePen en Wizard (Iteración 1)

Fecha: 2026-08-19 · Modo: ORCHESTRATOR/AUTO · Fuente de verdad: `.docs/`

## Resumen

Se implementaron dos partes: (A) smooth scroll robusto en mobile vía helper JS, eliminando el `scroll-behavior: smooth` global; y (B) la animación scale del CodePen adaptada a la entrada/salida del wizard de reserva. No se tocó ninguna API de Next.js (solo componentes client + CSS), conforme a AGENTS.md y a las reglas del frontend.

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `frontend/src/app/globals.css` | Eliminado el bloque `html { scroll-behavior: smooth; }` (+ comentario). Conservado `scroll-margin-top: 64px`. Reemplazados los keyframes de entrada/salida del wizard por la versión CodePen. Reduced-motion y `.landing-wizard-summary-in` intactos. |
| `frontend/src/lib/smooth-scroll.ts` | **Nuevo.** Helper `smoothScrollToSection(id)` y `smoothScrollToTop()` que respetan `prefers-reduced-motion`. |
| `frontend/src/components/landing/LandingNav.tsx` | Anclas desktop y móvil ahora `onClick` con `e.preventDefault()` + `smoothScrollToSection(link.id)`; móvil conserva `setOpen(false)`. `handleLogoClick` usa `smoothScrollToTop()`. |
| `frontend/src/components/landing/ScrollToTopButton.tsx` | `window.scrollTo(...)` → `smoothScrollToTop()`. |
| `frontend/src/hooks/booking/use-booking.ts` | `setStep` (línea 47): `window.scrollTo(...)` → `smoothScrollToTop()`. Lógica de negocio intacta. |

## Keyframes finales (globals.css)

Entrada (paso activo):
```css
.landing-wizard-form {
  animation: landing-wizard-step-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes landing-wizard-step-in {
  0%   { opacity: 0; transform: scale(0.2); }
  60%  { opacity: 1; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}
```

Salida (paso completado):
```css
.landing-wizard-form-exit {
  animation: landing-wizard-step-out 0.3s ease-in both;
}
@keyframes landing-wizard-step-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(120px) scale(0.9); }
}
```

Conservado tal cual: `.landing-wizard-summary-in` (fade + translateY(8px), delay 0.1s) y el bloque `@media (prefers-reduced-motion: reduce)`, que neutraliza las mismas clases (`landing-wizard-form`, `-form-exit`, `-summary-in`, `-collapse`) por lo que los nuevos keyframes quedan desactivados automáticamente.

## Verificación

Desde `/home/eduardo/trimflow/frontend`:

1. `npm run lint` — **7 problemas (4 errores, 3 warnings)**. Verificado como **preexistentes**: idénticos al hacer `git stash` (código original). Afectan a `use-public-data.ts` y `use-tenant-name.ts`, archivos NO tocados. Cero errores nuevos.
2. `npx tsc --noEmit` — **sin errores (exit 0)**.
3. `npm run test` — **1 suite falló / 8 pasaron (4 tests fallados / 46 pasados)**. Fallos en `services/page.test.tsx` (dashboard). Verificado como **preexistentes** (idénticos con `git stash`). Ningún test toca los archivos modificados.
4. Dev server en :3001 — responde correctamente (307 redirect), **sin errores de compilación** ni "Failed to compile".

## Desviaciones del plan

Ninguna. Se ejecutó exactamente según el plan técnico; las Partes B2 y C (reduced-motion, `BookingWizard.tsx`, `BookingStepSummary.tsx`, backend, dashboards, `.docs`) no se modificaron.

---

# Auditoría (Agente Auditor)

**Fecha:** 2026-08-19 · **Fuente de verdad:** `.docs/` · **Orden de validación:** requirements → architecture → decisions → plan del Planner → código `frontend/src/`.

## 1. Validación contra `.docs/`

| Fuente | Verificación | Resultado |
|---|---|---|
| `.docs/decisions/ADR-015-identidad-dark-luxury-landing.md` | Easing editorial `cubic-bezier(0.22, 1, 0.36, 1)` (§7 «Animaciones sutiles», §8 gold-hairline) | ✅ Se reusa el mismo easing editorial en la entrada/salida del wizard. |
| `.docs/decisions/ADR-016-reconstruccion-editorial-landing.md` | Principio «Microinteracciones sutiles» + «Accesibilidad» (reduced-motion desactiva TODA animación) | ✅ Keyframes nuevos gated por `prefers-reduced-motion`; microinteracción discreta, sin animación decorativa excesiva. |
| `.docs/decisions/ADR-013-personalizacion-landing-publica.md` | Aislamiento landing/dashboard por CSS vars de scope local (§3) + keyframe `landing-marquee` como único global | ✅ Todos los cambios están en clases `.landing-*`/helper client-only; no se toca el tema de dashboards (ADR-007). El helper `smooth-scroll.ts` es `"use client"` y no introduce estilos globales. |
| `.docs/decisions/ADR-014/017/018`, `.docs/architecture`, `.docs/requirements` | Sin relación con esta iteración; no modificados | ✅ Intactos. |

## 2. Criterios de éxito (evidencia con archivo:línea)

### C1 — Anclas de la landing deslizan suavemente en desktop
**VEREDICTO: ✅ CUMPLE**
- Anclas desktop: `LandingNav.tsx:84-101` — `<a href="#id">` + `onClick` con `e.preventDefault()` + `smoothScrollToSection(link.id)`.
- Anclas móvil: `LandingNav.tsx:141-158` — idéntico + `setOpen(false)`.
- `smoothScrollToSection` usa `scrollIntoView({ block: "start", behavior: "smooth" })` (`smooth-scroll.ts:8-12`).
- `scroll-margin-top: 64px` conservado para `#servicios/#equipo/#horarios/#ubicacion` (`globals.css:280-285`), compatible con `block: "start"`.

### C2 — El scroll en mobile ya no «se va para cualquier lado»
**VEREDICTO: ✅ CUMPLE** (verificado estáticamente; el comportamiento runtime queda sujeto a la comprobación manual en device)
- Eliminado el `html { scroll-behavior: smooth }` global (`git diff` / `globals.css`, ya ausente en la versión actual).
- Los únicos scrolls programáticos restantes pasan por el helper (`smooth-scroll.ts:16`); `grep` confirma cero `behavior: "smooth"` fuera del helper.
- El scroll del wizard al cambiar de paso usa el helper (`use-booking.ts:46-49`), evitando el salto brusco previo.

### C3 — El form del paso activo entra con `scale(0.2 → 1.1 → 1)` + fade (overshoot al 60%)
**VEREDICTO: ✅ CUMPLE**
- `globals.css:363-370`: `.landing-wizard-form { animation: landing-wizard-step-in 0.5s cubic-bezier(0.22,1,0.36,1) both }` con `0% scale(0.2)` / `60% scale(1.1)` / `100% scale(1)`, opacity 0→1 en el primer tramo. Overshoot exacto en el 60%.
- La clase `.landing-wizard-form` se aplica al form activo (`BookingWizard.tsx:371`).

### C4 — Al completar un paso, el form sale con `translateY(120px) + scale(0.9)` + fade y se convierte en card resumen
**VEREDICTO: ✅ CUMPLE**
- `globals.css:374-380`: `.landing-wizard-form-exit { animation: landing-wizard-step-out 0.3s ease-in both }` con `to { opacity:0; transform: translateY(120px) scale(0.9) }`.
- Clase aplicada en `BookingWizard.tsx:346`; la carcasa colapsa con `landing-wizard-collapse` (348) y el resumen entra con `landing-wizard-summary-in` (359). Morph form→card coherente con la entrega.
- Sin referencias huérfanas: las keyframes anteriores (`landing-wizard-in`, `landing-wizard-exit-fade`) no quedan referenciadas en ningún sitio.

### C5 — `prefers-reduced-motion` respetado
**VEREDICTO: ✅ CUMPLE**
- Helper JS: `prefersReducedMotion()` con `window.matchMedia("(prefers-reduced-motion: reduce)")`; usa `behavior: "auto"` si reduce (`smooth-scroll.ts:3-5, 11, 16`).
- Bloque CSS `@media (prefers-reduced-motion: reduce)` neutraliza los keyframes nuevos: `.landing-wizard-form` (635-639), `.landing-wizard-form-exit`/`.landing-wizard-summary-in` (640-645) y `.landing-wizard-collapse` (646-649).

### C6 — No se rompen animaciones/estilos de la landing (ADR-015/016)
**VEREDICTO: ✅ CUMPLE**
- El easing `cubic-bezier(0.22,1,0.36,1)` y las duraciones (0.5s/0.3s/0.45s) se mantienen en la línea editorial de ADR-015/016.
- Cambios 100% confinados a clases `.landing-*` y al helper client; `grep` de `scrollTo`/`scroll-behavior` no muestra residuos globales fuera del helper.

## 3. Verificación de compilación (re-ejecutada por el auditor)

Desde `/home/eduardo/trimflow/frontend`:

1. `npx tsc --noEmit` — **exit 0, sin errores**. ✅
2. `npm run lint` — **7 problemas (4 errores, 3 warnings)**, todos en archivos NO tocados por esta iteración: `use-availability.ts:20`, `use-public-data.ts:37`, `use-tenant-name.ts:27` (errores `react-hooks/set-state-in-effect`), `BookingWizard.tsx:130` (`no-html-link-for-pages`) y warnings `<img>` en `admin/landing/page.tsx:240,263` y `LandingGallery.tsx:46`. **Cero errores nuevos** en `smooth-scroll.ts`, `LandingNav.tsx`, `ScrollToTopButton.tsx`, `use-booking.ts` o `globals.css`. ✅

## 4. Verificación de alcance (fuera de alcance intacto)

| Ítem fuera de alcance | Estado |
|---|---|
| Backend | ✅ Sin cambios (`git status` solo muestra archivos frontend + `smooth-scroll.ts` nuevo + reporte). |
| Lógica de negocio de `useBooking` | ✅ Solo cambió la línea de scroll de `setStep` (`use-booking.ts:46-49`); el resto (steps, validación, submit, lookup) intacto. |
| Steps / tipos | ✅ Intactos. |
| Dashboards | ✅ Intactos. |
| `.docs/` | ✅ Intactos (ningún archivo de `.docs` modificado). |
| `BookingWizard.tsx` / `BookingStepSummary.tsx` | ✅ No modificados (referencian las clases CSS ya definidas). |

## 5. Hallazgos

| Severidad | Hallazgo |
|---|---|
| — | **Fallas:** ninguna. |

| Severidad | Observación |
|---|---|
| BAJA | La sección «Verificación» del reporte (línea 50) atribuye los 7 problemas de lint solo a `use-public-data.ts` y `use-tenant-name.ts`; también existen en `use-availability.ts`, `BookingWizard.tsx`, `LandingGallery.tsx` y `admin/landing/page.tsx`. La conclusión (preexistentes, cero errores nuevos) es correcta; solo la enumeración es incompleta. |
| BAJA | La regla `html { scroll-behavior: auto }` del bloque reduced-motion (`globals.css:622-625`) es ahora redundante tras eliminar el `scroll-behavior: smooth` global; inofensiva, puede limpiarse en una iteración futura. |
| BAJA | Criterio C2 validado estáticamente (eliminación del smooth global + scrolls programáticos vía helper); se recomienda confirmación manual en dispositivo móvil real antes del release. |

## 6. Veredicto final

**VEREDICTO: APROBADO CON OBSERVACIONES**
**FALLAS:** ninguna
**OBSERVACIONES:**
1. (BAJA) Enumeración incompleta de archivos con lint preexistente en la sección «Verificación» del reporte.
2. (BAJA) Regla redundante `html { scroll-behavior: auto }` en el bloque reduced-motion; limpiable en iteración futura.
3. (BAJA) C2 verificado estáticamente; recomendada confirmación manual en mobile.