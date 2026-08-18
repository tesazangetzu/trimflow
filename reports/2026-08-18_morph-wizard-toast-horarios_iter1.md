# Iter 1 — Morph wizard form→card + Toast/cierre en admin horarios

Fecha: 2026-08-18 · Executor-agent · Objetivo confirmado (A y B)

## Archivos modificados

1. `frontend/src/components/booking/BookingWizard.tsx`
2. `frontend/src/app/globals.css`
3. `frontend/src/app/(dashboard)/admin/schedules/page.tsx`
4. `frontend/src/app/(dashboard)/admin/schedules/page.test.tsx`

Ningún archivo nuevo creado.

## Resumen de cambios

### PARTE A — Morph form→card en el wizard

**BookingWizard.tsx**
- Import añadido: `useEffect, useRef` (junto a `useMemo, useState`).
- Nuevo estado `leavingStep` + ref `prevStepRef`. Un `useEffect` sobre `booking.step`
  captura el paso editable anterior (cuando `prev !== booking.step` y `prev` está en
  `EDITABLE_STEPS`), lo setea en `leavingStep` y lo limpia con `setTimeout(300ms)`.
  No se modifica `booking.step` ni el hook `useBooking`.
- En el contenedor `space-y-3`, cuando `leavingStep` está activo se renderiza ANTES de
  los summaries una "carcasa" `aria-hidden` con el chrome de la card
  (`rounded-2xl border border-border bg-card p-6 shadow-sm`) y clase
  `landing-wizard-form-exit`, que colapsa simulando la transformación form→card.
- El paso real saliente NO se re-monta; la carcasa solo transporta forma/altura.
- `key={booking.step}` del form activo se conserva intacto.
- Cada `BookingStepSummary` se envuelve en `<div className="landing-wizard-summary-in">`
  (el resumen recién aparecido se anima al entrar).

**globals.css (sección "Landing pública", tras `landing-wizard-form`)**
- `.landing-wizard-form-exit` → `landing-wizard-out` 0.28s, easing
  `cubic-bezier(0.22,1,0.36,1)`, de `{opacity:1; transform:none; max-height:1000px}`
  a `{opacity:0; transform:translateY(-8px) scale(0.98); max-height:0}`.
- `.landing-wizard-summary-in` → `landing-wizard-summary-in` 0.45s, mismo easing, de
  `{opacity:0; transform:translateY(8px)}` a `{opacity:1; transform:none}`.
- Bloque `@media (prefers-reduced-motion: reduce)`: ambas nuevas clases quedan con
  `animation:none; opacity:1; transform:none; max-height:none` (respeto de
  accesibilidad).

### PARTE B — Admin horarios

**schedules/page.tsx**
- Import de `useToastManager` desde `@/components/ui/toast`.
- Dentro de `AdminSchedulesPage`: `const { add } = useToastManager()`.
- En `handleSubmit` (ruta de éxito, tras refrescar barbers): se llama
  `add({ title, description, type: "success" })` con mensaje distinto para crear
  ("Horario creado" / "El horario se agregó correctamente.") vs actualizar
  ("Horario actualizado" / "El horario se guardó correctamente."), se cierra el modal
  con `setDialogOpen(false)` y luego `resetForm()`. El `catch` (formError) se mantiene.

**schedules/page.test.tsx**
- `renderWithData`, `renderWithManyBarbers`, skeleton y un caso extra se envuelven en
  `<Toaster><SchedulesPage /></Toaster>` porque el componente ahora usa
  `useToastManager` y Base UI exige un `Toast.Provider`.

## Resultado typecheck / lint / tests

- `npx tsc --noEmit` → sin errores.
- `npm run lint` → 4 errores y 3 warnings, TODOS pre-existentes y fuera de alcance:
  - `<a href="/login">` en `BookingWizard.tsx:115` (indicado como pre-existente en el plan).
  - `react-hooks/set-state-in-effect` en `use-availability.ts`, `use-public-data.ts`,
    `use-tenant-name.ts` (hooks que no toqué).
  - warnings `no-img-element` (landing/admin-landing, pre-existentes).
  - Sin errores nuevos introducidos por mis cambios.
- `npm test -- --runInBand` → `1 failed / 8 passed` suites, `4 failed / 46 passed`
  tests. La única suite roja es `admin/services/page.test.tsx` (pre-existente: ya usaba
  `useToastManager` sin `Toast.Provider` en su test, y no está en mi alcance). Los
  11 tests de `admin/schedules` pasan.

## Decisiones de implementación

- `timeout` del `leavingStep` = 300 ms > duración del exit (0.28 s) para que la
  carcasa nunca quede montada tras terminar la animación (cumple el Paso 4).
- El shell de salida es una card vacía con el chrome exacto del form. No renderiza el
  step saliente para evitar re-montar props que ya reflejan el paso nuevo (cumple el
  Paso 2). Al ser una carcasa sin contenido, la animación de `max-height` colapsa el
  padding del chrome; la sensación de morph la aportan el slide-up + scale + fade.
- El toast de éxito se dispara antes de `resetForm()` (que pone `editingScheduleId` en
  `null`) para poder distinguir crear/actualizar leyendo `editingScheduleId`.
- Envolví el test de schedules en `<Toaster>` (provee el `Toast.Provider` requerido por
  Base UI) en lugar de solo `<ToastProvider>` para que la suite siga verde.

## Problemas / desviaciones del plan

- No hubo desviaciones funcionales del plan A y B.
- Desviación mínima y necesaria: modifiqué `schedules/page.test.tsx` (no previsto
  explícitamente en el plan, pero requerido por la restricción "revisa que no rompas
  tests existentes") para envolver el render en `Toaster`, porque el componente ahora
  usa `useToastManager`.
- Persistió el fallo pre-existente de `admin/services/page.test.tsx` (fuera de alcance;
  el plan solo pedía no romper tests del admin/schedules).

---

# Auditoría (Auditor-agent)

## Veredicto general

**APROBADO** — Los 11 criterios de auditoría se cumplen. No hay fallas que bloqueen
el merge. Se registran observaciones no bloqueantes (sección más abajo).

## Tabla de criterios

| # | Criterio | Estado | Evidencia (archivo:línea) |
|---|----------|--------|---------------------------|
| 1 | Morph: `leavingStep`/`prevStepRef` capturan el paso saliente con timeout y se renderiza carcasa con chrome de card que colapsa | CUMPLE | `BookingWizard.tsx:56-67` (estado+ref+useEffect+timeout 300ms); `BookingWizard.tsx:242-247` (carcasa `aria-hidden` con `landing-wizard-form-exit`) |
| 2 | Keyframes `landing-wizard-out` (0.28s) y `landing-wizard-summary-in` (0.45s) con easing `cubic-bezier(0.22,1,0.36,1)` | CUMPLE | `globals.css:386-388` (exit 0.28s+bezier); `globals.css:403-405` (summary-in 0.45s+bezier) |
| 3 | Timing: timeout del leavingStep ≥ duración del exit (sin flash ni huérfano) | CUMPLE | `BookingWizard.tsx:64` (`setTimeout(…, 300)` > 280 ms del exit); cleanup en `:65` |
| 4 | `key={booking.step}` conservado en el form activo | CUMPLE | `BookingWizard.tsx:261` |
| 5 | Toast horarios: `useToastManager` importado; toast éxito (crear vs actualizar) en ruta de éxito de `handleSubmit` | CUMPLE | `page.tsx:26` (import); `page.tsx:215-221` (mensaje condicional por `editingScheduleId`, `type:"success"`) |
| 6 | Cierre de modal: `setDialogOpen(false)` tras guardar | CUMPLE | `page.tsx:222` |
| 7 | `use-booking.ts` NO modificado | CUMPLE | `git diff --name-only src/hooks/booking/` → sin cambios |
| 8 | Steps NO modificados | CUMPLE | `git diff --name-only src/components/booking/steps/` → sin cambios |
| 9 | `prefers-reduced-motion`: animaciones del wizard neutralizadas | CUMPLE | `globals.css:644-650` (ambas clases con `animation:none; opacity:1; transform:none; max-height:none` dentro del bloque reduce) |
| 10 | Compilación sin errores nuevos | CUMPLE | `npx tsc --noEmit` → exit 0 |
| 11 | Suite de schedules pasa (envuelta en Toaster) | CUMPLE | `page.test.tsx:54,57,72,84,225` (`<Toaster>`); `jest --runTestsByPath …schedules/page.test.tsx` → 11 passed / 0 failed |

## Fallas

No se detectaron fallas. No hay severidades CRÍTICA/ALTA/MEDIA/BAJA que corregir.

## Observaciones no bloqueantes

1. **Carcasa sin contenido (morph "simbólico").** La carcasa de salida
   (`BookingWizard.tsx:243-246`) es una card vacía (`p-6`, sin contenido) que solo
   transporta el chrome. El morph real lo aportan el slide-up + scale + fade del
   keyframe, no la transformación de contenido. Cumple el objetivo declarado, pero
   un morph visual más fiel requeriría clonar el contenido del paso saliente (mayor
   costo de render). No bloquea.
2. **Carcasa visible en `prefers-reduced-motion`.** Con animación desactivada, la
   carcasa se renderiza `opacity:1; max-height:none` durante 300 ms y luego se
   desmonta de golpe (parpadeo de card vacía). Está dentro del alcance aceptado
   del plan, pero se podría ocultar la carcasa por completo bajo
   `prefers-reduced-motion` (`display:none`) para eliminar ese parpadeo. No bloquea.
3. **`landing-wizard-form-exit` sin contenido interior.** Al colapsar `max-height:0`,
   solo se comprime el padding del chrome. Si en el futuro el form tuviera altura
   variable grande, `max-height:1000px` podría recortar el inicio de la animación;
   hoy no es caso real. No bloquea.
4. **`admin/services/page.test.tsx` sigue en rojo (pre-existente).** Fuera del alcance
   de este objetivo (el plan solo exigía no romper `admin/schedules`). Recomendable
   tratarlo en una iteración futura de higiene de tests. No bloquea.

## Conclusión

La implementación satisface íntegramente el objetivo confirmado A (morph form→card
en el wizard de reserva) y B (toast de éxito + cierre de modal en admin horarios),
respetando todas las restricciones: sin tocar backend, sin modificar `useBooking` ni
los steps, sin cambiar tipos, y conservando `prefers-reduced-motion` y el estilo dark
luxury (easing `cubic-bezier(0.22,1,0.36,1)`). La desviación necesaria del plan
(envolver el test de schedules en `Toaster`) es correcta y mantiene la suite verde.
Se recomienda aprobar y avanzar a la siguiente iteración.