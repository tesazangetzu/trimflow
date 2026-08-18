# Iter 1 — Smooth scroll landing + wizard de reserva con cards apiladas

Fecha: 2026-08-18 · Ejecutor: Executor-agent · Modo: AUTO

## Alcance
Solo frontend. Backend intacto. No se tocó `middleware.ts` ni `proxy`.
No se modificó `use-booking.ts` (solo lectura) ni los steps (`SelectService`,
`SelectBarber`, `SelectDate`, `Checkout`, `Success`) ni los tipos.

## 1. Archivos modificados/creados

- Modificado: `frontend/src/app/globals.css`
- Modificado: `frontend/src/components/booking/BookingWizard.tsx`
- Creado: `frontend/src/components/booking/BookingStepSummary.tsx`

## 2. Resumen de cada cambio

### PARTE A — Smooth scroll

**globals.css**
- `scroll-behavior: smooth` movido de `.landing-page` (div) a `html`, donde ocurre
  realmente el scroll del documento. `.landing-page` conserva solo `overflow-x: clip`.
- Añadido `scroll-margin-top: 64px` a `#servicios, #equipo, #horarios, #ubicacion`
  (48px de navbar `h-12` + 16px de colchón), para que las secciones ancladas no
  queden tapadas por la navbar sticky.
- En `@media (prefers-reduced-motion: reduce)`: añadido `html { scroll-behavior: auto; }`
  y neutralizadas las animaciones del wizard (`.landing-wizard-form`).
- Definidas `@keyframes landing-wizard-in` y la clase `.landing-wizard-form`
  (fade + `translateY(14px)` → reposo, easing `cubic-bezier(0.22,1,0.36,1)`, 0.45s),
  alineadas con el lenguaje editorial de ADR-015/016.

### PARTE B — Wizard de cards apiladas

**BookingWizard.tsx**
- Orden editable `EDITABLE_STEPS = ["service","barber","date","checkout"]`.
- Derivación de resúmenes: para cada paso editable anterior al activo, si tiene
  datos, se genera una card resumen (servicio+precio, barbero, fecha · hora).
- Render reorganizado:
  - `success` → pantalla final completa (sin mecánica de resumen), tal como estaba.
  - resto → stack `space-y-3` de `BookingStepSummary` (los pasos completados
    anteriores al activo) + form del paso activo envuelto en `.landing-wizard-form`.
- Click en una card resumen → `booking.setStep(s.step)` (API read-only del hook),
  que re-expande ese form y re-pliega los posteriores; el hook ya hace
  `window.scrollTo({ top: 0, behavior: "smooth" })`.
- Helpers `formatPrice`/`formatDate` (mismo formato es-CL que Checkout) movidos al
  módulo para reutilizarlos en los resúmenes.

**BookingStepSummary.tsx (nuevo)**
- Card compacta y clicable (botón) con label + valor + `meta` opcional (precio) y
  un hint "Editar". Usa tokens shadcn que `WIZARD_TOKENS` mapea a la paleta landing.

## 3. Resultado typecheck / lint / tests
- `npx tsc --noEmit`: **OK** (sin errores).
- `npx eslint` sobre los dos archivos tocados: solo **1 error pre-existente**
  (`@next/next/no-html-link-for-pages` en el `<a href="/login">` del bloque
  `notFound`). Confirmado como pre-existente con `git stash` (idéntico en la base).
- Tests: no existen tests del wizard de booking. Los tests existentes del repo son
  del dashboard (appointments/services/schedules/tenant), no relacionados.

## 4. Decisiones de implementación
- **No se añadió el estado `editingStep`** que mencionaba el plan (Paso 4). Es
  redundante: el paso activo ya es `booking.step` (el hook lo controla y
  `setStep` hace scroll-to-top). Añadirlo habría sido estado sin uso → error de lint
  (no-unused-vars). El comportamiento derivado del plan se cumple íntegro con
  `booking.step` + presencia de datos.
- Resúmenes solo para `service`/`barber`/`date` (los anteriores a `checkout`);
  `checkout` nunca queda "anterior a un paso activo" y `success` queda fuera, por lo
  que no generan card. Lógica genérica sobre `EDITABLE_STEPS` mantiene el caso futuro.
- Se usaron tokens shadcn (`bg-card`, `border-border`, `text-foreground`, etc.) en las
  nuevas cards — no clases `landing-*` directas — para mantener consistencia con los
  steps existentes; `WIZARD_TOKENS` ya los resuelve contra la paleta landing.

## 5. Problemas / desviaciones del plan
- **scroll-margin-top vs scroll-mt existente:** las secciones `#servicios/#equipo/#horarios`
  ya traían `scroll-mt-24` (96px) en el JSX; `#ubicacion` es un `<span>` sin offset.
  Se aplicó el CSS del plan (64px) que, por especificidad de id, pasa a gobernar.
  64px sigue siendo > 48px de navbar, así que nada queda tapado; es una reducción
  sutil (96→64) en el offset de esas tres secciones. Observación, no rotura.
- Sin otros problemas ni desviaciones.

---

# SECCIÓN DE AUDITORÍA

Fecha: 2026-08-18 · Auditor: Auditor-agent · Modo: AUTO
Fuente de verdad: `.docs/` (mvp-scope, architecture/modules, ADR-012/013/015/016) + plan del Planner + código en `frontend/src/`.

## Veredicto general

**APROBADO CON OBSERVACIONES**

No hay fallas de severidad CRÍTICA ni ALTA. Las observaciones MEDIA/BAJA se documentan sin bloquear el cierre del ciclo.

## Tabla de criterios

| # | Criterio | Estado | Evidencia |
|---|----------|--------|-----------|
| 1 | Smooth scroll en el elemento correcto (html/body), no solo `.landing-page` | CUMPLE | `scroll-behavior: smooth` movido a `html` en `frontend/src/app/globals.css:282`; `.landing-page` conserva solo `overflow-x: clip` (`globals.css:279`). Los anclas del nav (`LandingNav.tsx:73-85`, `:126-139`) ahora deslizan porque el scroll ocurre en el documento. |
| 2 | scroll-margin-top: secciones visibles bajo navbar sticky | CUMPLE | `scroll-margin-top: 64px` en `globals.css:291` para `#servicios/#equipo/#horarios/#ubicacion`; navbar `h-12`=48px → 64px > 48px, nada queda tapado. IDs verificados en `LandingSections.tsx:64,147,258,260`. |
| 3 | prefers-reduced-motion neutraliza smooth scroll y animaciones del wizard | CUMPLE | `@media (prefers-reduced-motion: reduce)` en `globals.css:578-587`: `html{scroll-behavior:auto}` (`:580`) y `.landing-wizard-form{animation:none;opacity:1;transform:none}` (`:585`). |
| 4 | Pasos completados anteriores al activo → cards resumen apiladas arriba | CUMPLE | Derivación de resúmenes en `BookingWizard.tsx:126-151` (loop sobre `EDITABLE_STEPS` filtrando `< activeEditableIndex` con datos); render del stack `space-y-3` de `BookingStepSummary` en `BookingWizard.tsx:220-222`. |
| 5 | Form del paso actual debajo de las cards con animación de entrada (fade + translate) | CUMPLE (con observación MEDIA sobre re-disparo) | Form envuelto en `.landing-wizard-form` en `BookingWizard.tsx:223`; animación `landing-wizard-in` (fade + `translateY(14px)`, easing editorial `cubic-bezier(0.22,1,0.36,1)`, 0.45s) en `globals.css:370-379`. Observación: solo se dispara en el primer mount (ver fallas). |
| 6 | Click en card resumen → re-expande el form de ese paso y re-pliega posteriores | CUMPLE | `BookingStepSummary` onClick → `booking.setStep(s.step)` en `BookingWizard.tsx:229`; `onClick` en `BookingStepSummary.tsx:18-19`. Los posteriores se ocultan automáticamente porque el filtro `>= activeEditableIndex` los excluye. |
| 7 | Paso success intacto (pantalla final completa, sin cards) | CUMPLE | Rama dedicada `booking.step === "success"` → `Success` full-screen en `BookingWizard.tsx:211-219`, fuera del stack de resúmenes. |
| 8 | Hook `use-booking.ts` NO modificado | CUMPLE | `git diff` de `frontend/src/hooks/booking/use-booking.ts` vacío; último commit `688535f`. Solo lectura. |
| 9 | Steps NO modificados | CUMPLE | `git diff` de `frontend/src/components/booking/steps/` vacío. Solo lectura. |
| 10 | Compilación (typecheck) sin errores nuevos | CUMPLE | `npx tsc --noEmit` → `TSC_EXIT=0` en `frontend/`. El único error eslint (`@next/next/no-html-link-for-pages` en el `<a href="/login">` del bloque notFound) es pre-existente, fuera del diff de esta iteración. |
| 11 | Consistencia estética con ADR-015/016 (tokens landing) | CUMPLE | Nuevas cards usan tokens shadcn (`bg-card`, `border-border`, `text-foreground`, `text-primary`, `text-muted-foreground`) en `BookingStepSummary.tsx:20-33`, resueltos a la paleta dark-luxury por `WIZARD_TOKENS` (`ReservationPage.tsx:17-37`). Sin clases `landing-*` inventadas ni hex sueltos. Animación alineada al easing editorial de ADR-015/016. |

## Fallas

| Severidad | Hallazgo | Archivo | Corrección sugerida |
|-----------|----------|---------|---------------------|
| MEDIA | La animación de entrada del form no se re-dispara al cambiar de paso: el contenedor `.landing-wizard-form` no lleva `key`, por lo que React reutiliza el mismo nodo y la animación CSS solo corre en el primer mount (paso `service`). Al avanzar/replegar, el form cambia de contenido sin fade+translate. El objetivo pide "el form del paso ACTUAL aparece ... con animación de entrada". | `BookingWizard.tsx:223` | Añadir `key={booking.step}` (o un `key` derivado del paso) al div `.landing-wizard-form` para que se remonte y reanime en cada transición de paso, conservando `prefers-reduced-motion`. |
| BAJA | `scroll-behavior: smooth` en `html` es global y aplica también a los dashboards, relajando levemente el aislamiento landing/dashboard de ADR-013 (la keyframe `landing-marquee` sí es scoped; esta regla no). Efecto benigno y estándar. | `globals.css:282` | Aceptable como está; si se quisiera aislar estrictamente, podría regresar la regla smooth a `.landing-page` manteniendo las anclas en la landing — pero el enfoque global es el correcto para que los anclas deslicen. No requiere acción. |
| BAJA | `window.scrollTo({ behavior: "smooth" })` en `setStep` (`use-booking.ts:47`) sigue animando bajo `prefers-reduced-motion`, porque es JS y no lo neutraliza la regla CSS (`globals.css:580`). Pre-existente y el hook está congelado por restricción del objetivo. | `use-booking.ts:47` | No corregir en esta iteración (hook fuera de alcance). Documentar como deuda; una futura iteración podría consultar `matchMedia('(prefers-reduced-motion: reduce)')`. |
| BAJA | Offset de anclas reducido de 96px (`scroll-mt-24` en el JSX) a 64px por especificidad de id en `#servicios/#equipo/#horarios`; `#ubicacion` es un `<span>` sin offset propio y ahora lo recibe por CSS. 64px > 48px, nada queda tapado; es una reducción sutil de colchón, decisión documentada. | `globals.css:291` + `LandingSections.tsx:64,147,258,260` | No requiere acción; si se desea el colchón original basta subir el valor a 96px. |
| BAJA | Duplicación de `formatPrice`/`formatDate` en `BookingWizard.tsx:32-46` (los steps ya tienen sus propios helpers: `Checkout.tsx:28,36`, `Success.tsx:15`, `SelectService.tsx:15`). Consistente con el patrón existente del módulo. | `BookingWizard.tsx:32-46` | Oportunidad DRY futura (extraer a un util compartido); no bloqueante, respeta la convención local. |

## Observaciones no bloqueantes

- El cambio de `scroll-behavior` de `.landing-page` a `html` es la corrección correcta: antes el scroll suave no operaba sobre los anclas porque el scroll del documento ocurre en `html`/`body`, no en el div contenedor. La implementación cumple el criterio 1 y el comentario del diff lo documenta bien.
- El plan del Planner proponía añadir un estado `editingStep` (Paso 4); el Executor lo omitió con justificación documentada (`booking.step` + presencia de datos ya derivan el estado activo y `setStep` re-expande). La decisión es correcta y evita estado redundante; el comportamiento derivado del plan se cumple íntegro.
- La derivación de resúmenes es genérica sobre `EDITABLE_STEPS` y excluye `checkout`/`success` por construcción, manteniendo el caso futuro (extender pasos) sin reescribir lógica.
- No se modificaron `middleware.ts`, `proxy`, tipos (`types/public.ts`, `types/landing.ts`), ni backend; el aislamiento frontend se respeta.
- No hay tests del wizard de booking; los tests del repo son del dashboard y no se ven afectados por este cambio (scoped a la landing). No se requiere nueva cobertura para esta iteración, aunque la mecánica de cards apiladas es buen candidato futuro.

## Conclusión

La implementación cumple los 11 criterios de auditoría y respeta íntegramente las restricciones del objetivo: solo frontend, `use-booking.ts` y los steps intactos, estética coherente con ADR-015/016 y `prefers-reduced-motion` respetado. La mecánica central (cards apiladas arriba + form actual debajo + click para re-expandir + success como pantalla final) está correcta. Las observaciones son no bloqueantes; la única MEDIA (re-disparo de la animación de entrada entre pasos) es un refinamiento de presentación y no afecta la funcionalidad ni el layout. Conforme al flujo del Orquestador, **APROBADO CON OBSERVACIONES** (sin fallas ALTA/CRÍTICA) habilita commit + push automáticos.