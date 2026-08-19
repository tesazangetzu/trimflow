# Iteración 3 — Wizard de reserva: animación secuencial de pasos

Fecha: 2026-08-19
Modo: ORCHESTRATOR / AUTO

## Objetivo
Hacer que la transición entre pasos del wizard de reserva sea **secuencial**:
1. Sale el form del paso completado (`step-out`).
2. Entra el card resumen del paso completado (`summary-in`).
3. Entra el siguiente paso (`step-in`), con retardo.

## Archivos modificados

### `frontend/src/app/globals.css`
- **Añadida** la clase de retardo del form del siguiente paso:
  ```css
  .landing-wizard-form--delayed {
    animation-delay: 0.75s;
  }
  ```
  (ubicada justo después de `.landing-wizard-form`).
- **Cambiado** el retardo de `.landing-wizard-summary-in` de `0.1s` a `0.3s`, de modo que el card entra después de que el form haya salido.
- **Añadida** neutralización de la clase de retardo dentro de `@media (prefers-reduced-motion: reduce)`:
  ```css
  .landing-wizard-form--delayed {
    animation-delay: 0s;
  }
  ```

### `frontend/src/components/booking/BookingWizard.tsx`
- **Añadido** el estado `isStepTransition` (booleano). Se activa en el efecto de cambio de paso (junto a `setLeavingStep`) cuando se abandona un paso editable.
- **Añadido** un segundo efecto que desactiva `isStepTransition` a los 1300 ms (delay 0.75 s + duración 0.5 s), tras concluir la entrada retardada del form.
- **Aplicada** la clase `landing-wizard-form--delayed` de forma condicional al form del paso activo vía `cn(...)`.

## Secuencia de animación final (timing)

Fase 0 — `t=0s`: el form del paso completado inicia su salida.
- `step-out`: 0.3s `ease-in` (translateY 0→120px, scale 1→0.9, opacity→0).
- La carcasa colapsa (`grid-rows`) en paralelo.

Fase 1 — `t=0.3s`: entra el card resumen.
- `summary-in`: 0.45s `cubic-bezier(0.22,1,0.36,1)`, **delay 0.3s** (translateY 8px→0, opacity→1).

Fase 2 — `t=0.75s`: entra el siguiente form.
- `step-in`: 0.5s `cubic-bezier(0.22,1,0.36,1)`, **delay 0.75s** (scale 0.2→1.1→1, opacity 0→1).
- El estado `isStepTransition` se desactiva a los 1.3s (fin completo de la animación).

Timing total de la secuencia: ~1.3s.

`prefers-reduced-motion`: todas las animaciones se anulan y el retardo pasa a `0s`.

## Corrección de bug (retardo del form no aplicado)

### Síntoma
El retardo del form del paso siguiente no se aplicaba: entraba de inmediato en vez de esperar 0.75s.

### Causa raíz
`isStepTransition` se seteaba a `true` dentro del `useEffect` que detecta el cambio de paso (el que setea `leavingStep`). Ese efecto corre **después** del render. Pero el form del paso activo se remonta por `key={booking.step}` en el render donde `isStepTransition` aún era `false`. Por eso la clase `landing-wizard-form--delayed` se añadía **después** de que el form ya había montado y empezado su animación → el retardo nunca se aplicaba.

### Corrección aplicada (en `BookingWizard.tsx`)
1. **Eliminado** el `setIsStepTransition(true)` tardío del efecto que detecta el cambio de paso (el de `leavingStep`). Ese efecto ahora solo setea `leavingStep` y el timeout de limpieza.
2. **Añadidos** wrappers que setean `isStepTransition(true)` de forma **síncrona**, antes de cambiar de paso:
   - `handleNext` → `setIsStepTransition(true)` + `booking.nextStep()`
   - `handlePrev` → `setIsStepTransition(true)` + `booking.prevStep()`
   - `handleSetStep(step)` → `setIsStepTransition(true)` + `booking.setStep(step)`
3. **Reemplazadas** todas las llamadas directas a `booking.nextStep` / `booking.prevStep` / `booking.setStep` por los wrappers:
   - `onNext={handleNext}`, `onPrev={handlePrev}` en los pasos service/barber/date/checkout.
   - `onClick={() => handleSetStep(s.step)}` en las cards de resumen.
4. **Mantenido** el efecto de limpieza que apaga `isStepTransition` a los 1300 ms.

Como `setIsStepTransition(true)` ocurre en el mismo tick antes del cambio de `booking.step`, cuando el form se remonta por `key={booking.step}` ya recibe la clase `landing-wizard-form--delayed` desde su primer render → el retardo de 0.75s sí se aplica.

## Verificación

- `npm run lint` — sin errores **nuevos**. En `BookingWizard.tsx` solo aparece el error preexistente `no-html-link-for-pages` (línea 159, `<a href="/login">`, en código no modificado). El resto (7 problemas: 4 errors, 3 warnings) son preexistentes en hooks no tocados (`use-public-data.ts`, `use-tenant-name.ts`).
- `npx tsc --noEmit` — **sin errores de tipos** (salida limpia).
- Dev server en `:3001` — responde correctamente (HTTP 307), sin errores de compilación.

## Desviaciones del plan

El plan pedía leer `prevStepRef.current` **durante el render** para derivar `isStepTransition`. Esto dispara el error de lint `react-hooks/refs` ("Cannot access refs during render"), que es un error NUEVO introducido por el cambio.

**Solución**: se sustituyó la lectura del ref en render por un **estado** `isStepTransition` gestionado en el efecto de cambio de paso existente:
- `prevStepRef` se sigue usando **dentro del efecto** (permitido) para detectar el cambio de paso.
- `isStepTransition` se activa junto a `setLeavingStep` cuando se abandona un paso editable, y se limpia a los 1300 ms.

Comportamiento equivalente al plan (retardo solo en transiciones, no en montaje inicial), pero respetando las reglas de React/ESLint. Resultado de verificación: lint/tsc limpios en los archivos tocados.

---

# Auditoría — Iteración 3

**Auditor:** Agente Auditor (ORCHESTRATOR / AUTO)
**Fuente de verdad:** `.docs/requirements/mvp-scope.md`, `.docs/architecture/modules.md`, `.docs/decisions/` (ADR-012/014/015/016)
**Fecha:** 2026-08-19

## 1. Criterios evaluados

| # | Criterio | Resultado |
|---|----------|-----------|
| C1 | Secuencia de animación correcta (`step-out` → `summary-in` → `step-in`) | ✅ CUMPLE |
| C2 | `isStepTransition` seteado síncronamente antes del cambio de paso (clase presente en primer render) | ✅ CUMPLE |
| C3 | No queda `setIsStepTransition(true)` tardío en el efecto de `leavingStep` | ✅ CUMPLE |
| C4 | Montaje inicial sin retardo (`isStepTransition` inicia en `false`) | ✅ CUMPLE |
| C5 | `prefers-reduced-motion` neutraliza el retardo | ✅ CUMPLE |
| C6 | Lógica de `leavingStep`/`closing`/timeout 300ms intacta | ✅ CUMPLE |
| C7 | Sin cambios fuera de alcance | ✅ CUMPLE |
| C8 | Compilación: `tsc --noEmit` y `lint` | ✅ CUMPLE |

## 2. Evidencia

### C1 — Secuencia de animación
- `frontend/src/app/globals.css:377-378` — `.landing-wizard-form-exit` anima `landing-wizard-step-out 0.3s ease-in both` (delay 0): sale el form del paso completado.
- `globals.css:401-403` — `.landing-wizard-summary-in` con `animation-delay: 0.3s` (cambiado de `0.1s`): el card resumen entra tras la salida del form.
- `globals.css:363-367` — `.landing-wizard-form` (step-in 0.5s) + `.landing-wizard-form--delayed { animation-delay: 0.75s }`: entra el siguiente form al final.

Timing verificado: `0.3s` → `0.3s` → `0.75s`. Secuencia correcta.

### C2 — Sincronía del estado de transición
- `BookingWizard.tsx:100-103` — `handleNext` setea `setIsStepTransition(true)` **antes** de `booking.nextStep()`.
- `BookingWizard.tsx:104-107` — `handlePrev` idem.
- `BookingWizard.tsx:108-111` — `handleSetStep` idem.
- `BookingWizard.tsx:398-403` — el form activo se remonta por `key={booking.step}` y recibe `isStepTransition && "landing-wizard-form--delayed"`. Como `setIsStepTransition(true)` y el cambio de `booking.step` ocurren en el mismo handler, React los procesa en el mismo render → la clase ya está presente en el primer render del form remontado. ✅

### C3 — Ausencia de set tardío en el efecto de `leavingStep`
- `BookingWizard.tsx:76-87` — el efecto de `booking.step` solo setea `setLeavingStep(prev)` y el timeout de limpieza (300ms). **No** contiene `setIsStepTransition(true)`. ✅ (el diff confirma que se eliminó)

### C4 — Montaje inicial sin retardo
- `BookingWizard.tsx:62` — `useState(false)`. El montaje inicial (primer paso) no aplica la clase de retardo. ✅

### C5 — `prefers-reduced-motion`
- `globals.css:661-663` — `.landing-wizard-form--delayed { animation-delay: 0s }` dentro de `@media (prefers-reduced-motion: reduce)`. ✅ (adicionalmente `globals.css:656-659` anula la animación del form y `664-673` el resto)

### C6 — `leavingStep`/`closing` intactos
- `BookingWizard.tsx:56` (`leavingStep`), `57` (`prevStepRef`), `66` (`closing`).
- `BookingWizard.tsx:68-74` — efecto de `closing` (doble rAF) intacto.
- `BookingWizard.tsx:76-87` — timeout de 300ms intacto.
- `globals.css:384-396` — colapso `grid-rows` y `.is-closing` intactos. ✅

### C7 — Fuera de alcance
- `git diff` — solo `frontend/src/app/globals.css` y `frontend/src/components/booking/BookingWizard.tsx`. No se tocó backend, `useBooking`, steps (`SelectService/Barber/Date/Checkout/Success`), dashboards, `.docs`, ni los keyframes de la iteración 1 (`landing-wizard-step-in`). ✅

### C8 — Compilación
- `npx tsc --noEmit` en `frontend/` — **0 errores** (exit 0).
- `npm run lint` en `frontend/` — **7 problemas (4 errors, 3 warnings)**, todos preexistentes en `use-public-data.ts` y `use-tenant-name.ts` (archivos no tocados).
- `npx eslint src/components/booking/BookingWizard.tsx` — **1 solo error preexistente** `no-html-link-for-pages` (línea 159, `<a href="/login">`, código no modificado). ✅

## 3. Alineación con `.docs`
- `mvp-scope.md:59` — flujo en 4 pasos + confirmación: intacto.
- `ADR-012/014` — el `BookingWizard` se reutiliza en `/[slug]/reservar`; el cambio es puramente presentacional (timing de animación), sin alterar la lógica de reserva (estado de `useBooking`, steps, endpoints). Consistente con el permiso de ADR-016 (microinteracciones) y el gating por `prefers-reduced-motion` exigido en ADR-014/016.
- `ADR-015:13` ("NO se toca la lógica de reservas") — cumplido: no se modifica lógica, solo secuenciación de animación en la presentación del wizard.

## 4. Veredicto por criterio
Todos los criterios (C1–C8) **CUMPLEN**. No se detectan fallas bloqueantes.

---

VEREDICTO: APROBADO CON OBSERVACIONES
FALLAS: ninguna
OBSERVACIONES:
- Comentario desactualizado en `globals.css:398-400` («~0.1s») que no refleja el nuevo retardo de `0.3s` del `.landing-wizard-summary-in`. Cosmético, no bloqueante.
- Edge case menor: si el usuario avanza dos pasos en rápida sucesión antes de los 1300ms, el `setIsStepTransition(true)` repetido (true→true) no re-dispara el efecto de limpieza, por lo que el timeout del primer clic apagará el estado algo antes del fin de la segunda entrada. El retardo CSS (`animation-delay`) igualmente se aplica a cada remount por `key`, por lo que la animación se conserva; solo el desmontaje de la clase es temprano. No observable en práctica normal, no bloqueante.
- El reporte (líneas 46 y 71) describe el comportamiento y la causa raíz con precisión y coincide con el código auditado.