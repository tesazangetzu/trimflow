# Reporte Técnico Final
## Smooth scroll en landing + wizard de reserva con cards apiladas

> **Generado:** 2026-08-18
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.12 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

- **(A)** Hacer smooth scroll en la landing y en los links de anclas (`#servicios`, `#equipo`, `#horarios`, `#ubicacion`).
- **(B)** Rediseñar el wizard de reserva para apilar cards de pasos completados con animación, mostrando el siguiente formulario debajo. Opciones 1 + 3 confirmadas: los pasos completados se compactan en cards resumen apiladas arriba; el form del paso actual aparece debajo con animación; al hacer click en una card resumen ésta colapsa y muestra el form de ese paso para editar.

**Éxito cuando:**
- Scroll del documento suave al hacer scroll manual y al navegar por anclas.
- Sin saltos bruscos; las secciones quedan bien posicionadas bajo la navbar sticky.
- Cada paso completado del wizard queda como card apilada arriba.
- El formulario siguiente aparece debajo con animación suave.
- No se rompen las animaciones/estilos existentes de la landing (ADR-015/016).

**Fuera de alcance:** backend, hook `useBooking`, steps del wizard, tipos, otras vistas del dashboard.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | Ninguna (solo observaciones MEDIA/BAJA no bloqueantes). La observación MEDIA (re-disparo de la animación de entrada entre pasos) se corrigió antes de cerrar el ciclo. |

---

## Decisiones técnicas tomadas

### Smooth scroll aplicado a `html` (no a `.landing-page`)

**Qué se decidió:**
Mover `scroll-behavior: smooth` del div `.landing-page` al elemento `html`, donde ocurre realmente el scroll del documento.

**Por qué se tomó esta decisión:**
El scroll del documento ocurre en `html`/`body`, no en el div contenedor. Por eso los anclas del nav saltaban bruscamente a pesar de que `.landing-page` ya tenía `scroll-behavior: smooth`. Aplicarlo a `html` hace que los anclas deslicen correctamente.

**Alternativas descartadas:**
- Mantener el smooth solo en `.landing-page` (no funcionaba para los anclas).
- Usar una librería de smooth scroll (Lenis/Locomotive): innecesaria, CSS nativo basta.

**Impacto en .docs:**
Ninguno. La decisión es coherente con ADR-013 (aislamiento landing/dashboard); el efecto global en dashboards es benigno y estándar.

**Impacto en el código:**
`frontend/src/app/globals.css` — regla `html { scroll-behavior: smooth }` en el bloque landing.

### Cards resumen apiladas derivadas del estado del hook (sin estado extra)

**Qué se decidió:**
No añadir un estado local `editingStep`; el paso activo ya es `booking.step` (controlado por el hook) y la presencia de datos determina qué pasos están completados.

**Por qué se tomó esta decisión:**
`booking.step` + presencia de datos ya derivan el estado activo y `setStep` re-expande el form y hace scroll-to-top. Añadir estado redundante habría generado un error de lint (no-unused-vars) sin aportar comportamiento.

**Alternativas descartadas:**
- Estado local `editingStep` (propuesto en el plan): redundante con `booking.step`.

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`frontend/src/components/booking/BookingWizard.tsx` — derivación genérica de resúmenes sobre `EDITABLE_STEPS`.

### Componente reutilizable `BookingStepSummary`

**Qué se decidió:**
Crear un componente nuevo `BookingStepSummary.tsx` para la card resumen clicable, en lugar de bloques inline.

**Por qué se tomó esta decisión:**
Limpieza y reutilización; la card resumen se usa para varios pasos (servicio, barbero, fecha).

**Alternativas descartadas:**
- Bloques inline en el wizard (más acoplado y repetitivo).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
Nuevo archivo `frontend/src/components/booking/BookingStepSummary.tsx`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `frontend/src/components/booking/BookingStepSummary.tsx` | Card resumen compacta y clicable para cada paso completado | Componente reutilizable para las cards apiladas |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/app/globals.css` | Smooth scroll movido a `html`; `scroll-margin-top: 64px` en secciones con id; keyframes/clase `.landing-wizard-form`; ampliado `prefers-reduced-motion` | Hacer que los anclas deslicen suavemente y que las secciones no queden tapadas; animar la entrada del form del wizard |
| `frontend/src/components/booking/BookingWizard.tsx` | Render reorganizado: cards resumen apiladas + form del paso activo con animación; click en card → `setStep`; `success` como pantalla final | Implementar la mecánica de cards apiladas (opciones 1 + 3) |

### Archivos eliminados

Ninguno.

---

## Cambios en archivos clave

### `frontend/src/components/booking/BookingWizard.tsx`

**Antes:** Un único div card (líneas 158-226) que mostraba solo el paso actual; al avanzar se reemplazaba el contenido.

**Después:** Stack `space-y-3` de `BookingStepSummary` (pasos completados anteriores al activo) + form del paso activo envuelto en `.landing-wizard-form` con `key={booking.step}` (re-anima en cada transición). Click en una card → `booking.setStep(s.step)` re-expande el form y re-pliega los posteriores. `success` se renderiza como pantalla final completa fuera de la mecánica de resumen.

**Por qué es importante:** Es el corazón del cambio de UX solicitado. Si se modifica sin entender el flujo, se puede romper la acumulación de cards o el re-expandir de pasos.

### `frontend/src/app/globals.css`

**Antes:** `scroll-behavior: smooth` en `.landing-page` (no efectivo para anclas); sin `scroll-margin-top`; sin animación de wizard.

**Después:** `html { scroll-behavior: smooth }`; `scroll-margin-top: 64px` en `#servicios/#equipo/#horarios/#ubicacion`; `@keyframes landing-wizard-in` + `.landing-wizard-form` (fade + translateY, easing `cubic-bezier(0.22,1,0.36,1)`, 0.45s); `prefers-reduced-motion` neutraliza scroll y animaciones del wizard.

**Por qué es importante:** Define el comportamiento de scroll global y la animación del wizard. Debe respetar `prefers-reduced-motion` y el lenguaje editorial de ADR-015/016.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Smooth scroll en el elemento correcto (html/body) | Cumplido | `globals.css:282` — `html { scroll-behavior: smooth }` |
| Secciones visibles bajo navbar sticky | Cumplido | `globals.css:291` — `scroll-margin-top: 64px` (> 48px de navbar) |
| prefers-reduced-motion respetado | Cumplido | `globals.css:578-587` — neutraliza scroll y animaciones |
| Pasos completados → cards resumen apiladas arriba | Cumplido | `BookingWizard.tsx:126-151,220-222` |
| Form del paso actual debajo con animación | Cumplido | `BookingWizard.tsx:223` + `globals.css:370-379` |
| Click en card → re-expande form y re-pliega posteriores | Cumplido | `BookingWizard.tsx:229` + `BookingStepSummary.tsx:18-19` |
| Paso success como pantalla final completa | Cumplido | `BookingWizard.tsx:211-219` |
| Hook `use-booking.ts` no modificado | Cumplido | `git diff` vacío |
| Steps no modificados | Cumplido | `git diff` vacío |
| Compilación sin errores nuevos | Cumplido | `npx tsc --noEmit` → exit 0 |
| Consistencia estética con ADR-015/016 | Cumplido | Tokens shadcn mapeados por `WIZARD_TOKENS` |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | `window.scrollTo({ behavior: "smooth" })` en `setStep` sigue animando bajo `prefers-reduced-motion` (es JS, no lo neutraliza el CSS). Pre-existente; hook congelado por restricción del objetivo. | BAJA | `use-booking.ts:47` | Futura iteración (consultar `matchMedia('(prefers-reduced-motion: reduce)')`) |
| 2 | Duplicación de `formatPrice`/`formatDate` entre wizard y steps. | BAJA | `BookingWizard.tsx:32-46` | Oportunidad DRY futura (util compartido) |
| 3 | `scroll-behavior: smooth` global aplica también a dashboards (relaja levemente aislamiento ADR-013). Efecto benigno y estándar. | BAJA | `globals.css:282` | No requiere acción |

---

## Lo que el programador debe saber

- **Smooth scroll:** ahora los anclas del nav de la landing deslizan suavemente y las secciones quedan bien posicionadas bajo la navbar sticky. El smooth es global (también afecta a los dashboards, de forma benigna).
- **Wizard de reserva:** al avanzar, cada paso completado queda como una card resumen apilada arriba; el form del paso actual aparece debajo con animación. Al hacer click en una card resumen, se re-expande el form de ese paso para editar y los posteriores se repliegan.
- **Animación entre pasos:** se añadió `key={booking.step}` al contenedor del form para que la animación de entrada se re-ejecute en cada transición de paso (corrección de la observación MEDIA del Auditor).
- **Convención nueva:** las cards resumen usan tokens shadcn (resueltos a la paleta landing por `WIZARD_TOKENS`), no clases `landing-*` directas — mantener esta convención en futuros cambios del wizard.
- **No se tocó** el hook `useBooking`, los steps, los tipos ni el backend.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-18_smooth-scroll-wizard-cards_iter1.md` |