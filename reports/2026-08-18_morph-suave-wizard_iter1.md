# Reporte de Ejecución — Iteración 1: Morph suave del wizard de reserva

**Fecha:** 2026-08-18
**Trigger:** ORCHESTRATOR · AUTO
**Ámbito:** Solo `frontend/` (Next.js 16, React 19, Tailwind 4, shadcn/ui)

## Contexto

El salto brusco al avanzar/quitar un paso en `/[slug]/reservar` (el card se forma y luego salta hacia arriba) se debía a tres causas: `max-height: 1000px → 0` no animable, la carcasa de salida vacía (`<div>` sin contenido), y el desmontaje instantáneo del form por `key={booking.step}`.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/booking/BookingWizard.tsx` | Extracción de `renderStepContent`, carcasa de salida con colapso real, estado/efecto `closing` |
| `frontend/src/app/globals.css` | Colapso por grid en `.landing-wizard-collapse`, nuevo `@keyframes landing-wizard-exit-fade`, ajuste `prefers-reduced-motion` |

## Resumen de cambios

### `BookingWizard.tsx`
- **Paso 1:** El bloque `switch` del form pasó a un helper interno `renderStepContent(step: BookingStep)` que reutiliza `booking`, `availability`, `services`, `barbers` vía closure. El form principal ahora hace `{renderStepContent(booking.step)}`.
- **Paso 2:** La carcasa vacía `<div className="landing-wizard-form-exit ..." aria-hidden />` se sustituyó por una carcasa que envuelve el contenido saliente real:
  `renderStepContent(leavingStep as BookingStep)` dentro de `.landing-wizard-collapse` (con clase `is-closing` condicional). Así el colapso de altura es continuo, sin desmontaje instantáneo.
- **Paso 3:** Se añadió `const [closing, setClosing] = useState(false)`. El toggle se dispara con doble `requestAnimationFrame` tras montar la carcasa.
  - **Desviación:** El `setClosing(false)` del plan era síncrono en el efecto, lo que disparaba una nueva regla de lint `react-hooks/set-state-in-effect`. Se movió el reset a `closing=false` dentro del `setTimeout` (asíncrono) que ya limpiaba `leavingStep` a los 300 ms. Se preserva la intención del plan (resetear `closing` antes de cada colapso) sin introducir errores de lint nuevos.
- **Paso 5:** No se añadió JS para interceptar scroll; se alineó la duración del colapso (~0.3 s) con el desplazamiento suave nativo.

### `globals.css`
- **Paso 4:** Se reemplazó `@keyframes landing-wizard-out` (con `max-height: 1000px`) por:
  - `@keyframes landing-wizard-exit-fade` (solo fade, 0.3 s, `cubic-bezier(0.22,1,0.36,1)`).
  - `.landing-wizard-collapse` con `display:grid; grid-template-rows:1fr` + `transition: grid-template-rows 0.3s`, `.is-closing { grid-template-rows: 0fr }`. Eliminado `max-height`.
- **Paso 6:** En el bloque `@media (prefers-reduced-motion: reduce)`: `.landing-wizard-collapse { transition: none; grid-template-rows: 0fr }` y se quitó `max-height: none` (ya no existe) de `.landing-wizard-form-exit`.

## Verificación

- `npx tsc --noEmit` → **0 errores**.
- `npm run lint` → **sin errores nuevos**. Persisten 5 errores pre-existentes en `use-public-data.ts`, `use-tenant-name.ts`, etc., y el `<a href="/login">` en `BookingWizard.tsx:130` (no introducido aquí).
- `npm test -- --runInBand` → 8 suites pasan, 1 falla (`admin/services/page.test.tsx`, dashboard `ServicesPage`/`useToastManager`). Es **pre-existente y no relacionada** con el wizard ni con los archivos modificados. No existen tests del wizard.
- No se tocó dashboard ni landing pública (solo la clase específica del wizard).

## Decisiones de implementación

- El reset de `closing` se movió al `setTimeout` de limpieza (asíncrono) para no violar `react-hooks/set-state-in-effect` y evitar errores de lint nuevos.
- Se usa `leavingStep as BookingStep` (la carcasa se monta con el cast del plan) aunque `leavingStep` se tipa `string | null`; válido porque solo se asigna con valores de `EDITABLE_STEPS`.

## Problemas / desviaciones

- **Única desviación:** ubicación del reset de `closing` (Paso 3), por la restricción de lint. Comportamiento equivalente.
- El fallo del test del dashboard es pre-existente; no fue introducido por esta iteración.

## Estado

Completado.

---

# Sección de Auditoría — Auditor-agent

**Fecha:** 2026-08-18 · **Modo:** AUTO · **Fuente de verdad:** `.docs/` + plan del Planner + código.

## Veredicto general

**APROBADO CON OBSERVACIONES** — Los 10 criterios de auditoría se cumplen. La implementación corrige la causa raíz del "salto" (eliminación de `max-height: 1000px → 0`, carcasa con contenido real y colapso por grid), respeta `prefers-reduced-motion` y los tokens/easing de ADR-015/016. No se violó ninguna restricción del objetivo (hook, steps, tipos, backend intactos). Solo hay observaciones menores no bloqueantes y una imprecisión menor en el reporte sobre el conteo de errores de lint.

## Tabla de criterios

| # | Criterio | Estado | Evidencia (archivo:línea) |
|---|----------|--------|---------------------------|
| 1 | Helper `renderStepContent` reutilizable | CUMPLE | `BookingWizard.tsx:184-250` — switch extraído; el form activo lo invoca en `:351` y la carcasa de salida en `:331`. |
| 2 | Carcasa con contenido real (no div vacío) | CUMPLE | `BookingWizard.tsx:325-334` — el `<div.landing-wizard-form-exit>` envuelve `renderStepContent(leavingStep as BookingStep)` dentro de `.landing-wizard-collapse`; el diff confirma que sustituye al `<div ... />` vacío previo. |
| 3 | Colapso por grid (sin `max-height`) | CUMPLE | `globals.css:397-409` — `display:grid; grid-template-rows:1fr` → `.is-closing { 0fr }`, `transition 0.3s`, `overflow:hidden`, `min-height:0`; `max-height` eliminado (`git diff` lo confirma). |
| 4 | Estado `closing` con doble `requestAnimationFrame` | CUMPLE | `BookingWizard.tsx:61-69` — `useState(false)` + efecto con rAF anidado tras el montaje; reset asíncrono en el `setTimeout` (`:76-79`). |
| 5 | `key={booking.step}` conservado en form activo | CUMPLE | `BookingWizard.tsx:348`. |
| 6 | `prefers-reduced-motion` neutraliza la técnica | CUMPLE | `globals.css:648-658` (`animation:none`) y `:659-662` (`transition:none; grid-template-rows:0fr`). |
| 7 | Hook `use-booking.ts` NO modificado | CUMPLE | `git diff` sobre el archivo = 0 líneas; solo se añadió la import de tipo `BookingStep` en `BookingWizard.tsx:5`. |
| 8 | Steps NO modificados | CUMPLE | `git diff --stat frontend/src/components/booking/steps/` vacío. |
| 9 | Compilación sin errores nuevos | CUMPLE | `npx tsc --noEmit` → exit 0. |
| 10 | Consistencia estética (easing + tokens ADR-015/016) | CUMPLE | `cubic-bezier(0.22,1,0.36,1)` coincide con `landing-rise` (`globals.css:605,628`); `globals.css` solo toca clases del wizard, sin afectar otras animaciones de la landing. |

## Fallas

No hay fallas de severidad CRÍTICA, ALTA ni MEDIA. Únicamente dos observaciones BAJA:

| Severidad | Archivo | Descripción | Corrección sugerida |
|-----------|---------|-------------|---------------------|
| BAJA | `frontend/src/components/booking/BookingWizard.tsx:63-69` | El cleanup del efecto de rAF solo cancela el *frame externo*; si `leavingStep` cambia antes de que dispare el rAF interno, `setClosing(true)` podría ejecutarse sobre una carcasa a punto de desmontarse. | Cancelar también el frame interno (guardar ambos ids o usar un flag `cancelled` en el cleanup). Impacto nulo en la práctica: `setClosing(true)` sobre un shell eliminado es inofensivo. |
| BAJA | `reports/..._iter1.md` §Verificación | Se afirma «Persisten 5 errores pre-existentes», pero el lint actual reporta **4 errores + 3 warnings** (`BookingWizard.tsx:130` por `<a>`, `use-public-data.ts:37`, `use-tenant-name.ts:27`, `use-availability.ts:20`, más warnings). El conteo es impreciso. | Corregir el número en el reporte. El único error de `BookingWizard` (`:130`, `<a href="/login">`) es pre-existente y NO fue introducido por esta iteración (verificado en el diff). |

## Observaciones no bloqueantes

- **Reduced-motion:** `.landing-wizard-collapse { grid-template-rows: 0fr }` es estático (no pasa por `1fr`), por lo que la carcasa aparece instantáneamente vacía. Correcto y deseado: el contenido saliente no debe animarse cuando el usuario solicita reducir movimiento.
- **Doble chrome de card:** durante el morph, la carcasa de salida y el form entrante tienen ambos `rounded-2xl border p-6`, pudiendo generar un breve solape de bordes; el fade de 0.3 s lo mitiga. Ajuste estético opcional.
- **Scroll natural:** no se añadió JS de interceptación de scroll (restringido por el objetivo al no poder modificar el hook). La duración del colapso (~0.3 s) se alineó con el scroll suave nativo; el criterio "no muy rápido" se aborda vía duración, no vía control de scroll. Aceptable dentro de las restricciones.
- **Desviación documentada (Paso 3):** el reset de `closing` se movió al `setTimeout` asíncrono para evitar `react-hooks/set-state-in-effect`. Comportamiento equivalente y justificado (evita errores de lint nuevos). No se detectó estado obsoleto de `closing=true` entre colapsos.

## Conclusión

La implementación cumple los criterios de éxito: no hay `max-height` no animable, la carcasa de salida envuelve contenido real y colapsa de forma continua vía `grid-template-rows`, el estado `closing` dispara la transición tras el montaje, `prefers-reduced-motion` neutraliza todo, y hook/steps/backend permanecen intactos. Compilación en verde y sin errores de lint nuevos. Se **APRUEBA con observaciones** (ambas BAJA, ninguna bloquea el merge).