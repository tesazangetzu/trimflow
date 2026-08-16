# Reporte Técnico Final
## Página de horarios: cards con búsqueda/paginado + modal solo formulario

> **Generado:** 2026-08-15 23:35 (-05)
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.x · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · lucide-react · Jest 29
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

Convertir la página de horarios del admin (`frontend/src/app/(dashboard)/admin/schedules/page.tsx`) en una "tabla de cards" con búsqueda por nombre/email, paginado de 5 por página y tags de horarios clicables que abren el modal en modo edición; reducir el modal a solo el formulario (sin tabla de horarios configurados); y corregir el bug de ancho del `DialogContent` haciendo el ancho configurable vía prop `maxWidth` con default `sm:max-w-sm` (retrocompatible).

**Éxito cuando:**
- La página muestra cards en vez de tabla, con búsqueda (name/email) y paginado de 5 por página.
- Los tags de horarios son clicables y abren el modal en modo edición.
- El modal solo contiene el formulario (sin tabla de horarios, sin DialogFooter/Cerrar redundante).
- `DialogContent` acepta `maxWidth` con default `sm:max-w-sm` sin romper los 13 usos existentes.
- `tsc --noEmit` exit 0, suite `schedules/page.test` 10/10, ESLint 0 problemas en archivos tocados.

**Fuera de alcance:**
- Backend (ningún cambio en servicios/endpoints).
- Lógica de break del barbero (ADR-011) y creación multi-día (ADR-008): se conservan intactas.
- Fallos de lint/test pre-existentes en archivos ajenos (no se corrigen en esta iteración).

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | — (3 observaciones BAJA no bloqueantes) |

> Nota: el ciclo fue reanudado en la fase AUDITOR — la iteración 1 había quedado ejecutada (Executor) pero sin auditar ni cerrar. No hubo rechazos ni reintentos.

---

## Decisiones técnicas tomadas

### Prop `maxWidth` en `DialogContent` (retrocompatible)

**Qué se decidió:**
Añadir la prop `maxWidth?: string` (default `sm:max-w-sm`) a `DialogContent`; la clase base ya no incluye `sm:max-w-sm` y se compone como `cn(baseClasses, maxWidth, className)`.

**Por qué se tomó esta decisión:**
El modal de horarios necesitaba más ancho (1000px) pero los otros 13 usos del componente dependían del ancho por defecto o lo sobreescribían vía `className`. Con `twMerge` en `cn()`, colocar `maxWidth` antes de `className` permite que las clases existentes sigan ganando — retrocompatibilidad total sin tocar los demás modales.

**Alternativas descartadas:**
- Seguir usando `max-w-[820px]` hardcodeado en el modal de horarios: no corregía el bug de ancho de forma general y mantenía la inconsistencia.
- Cambiar el default global: habría roto los modales que dependen de `sm:max-w-sm`.

**Impacto en .docs:**
Ninguno (decisión de implementación; no altera ADRs existentes).

**Impacto en el código:**
`frontend/src/components/ui/dialog.tsx` queda con una API ampliada; futuros modales pueden especificar ancho por prop.

### Modal de horarios reducido a solo formulario

**Qué se decidió:**
Eliminar del modal la tabla de horarios configurados, el `Separator` y el `DialogFooter`/botón Cerrar; se conserva `max-h-[calc(100vh-4rem)]` + scroll interno.

**Por qué se tomó esta decisión:**
ADR-008 (formularios cortos en modales) justifica que crear/editar ocurra en el mismo contexto; la tabla dentro del modal duplicaba información ya visible en las cards y añadía scroll innecesario.

**Alternativas descartadas:**
- Mantener la tabla dentro del modal: UX redundante y modal más alto de lo necesario.
- Migrar a vista de página: contradice ADR-008.

**Impacto en .docs:**
Ninguno — refuerza ADR-008.

**Impacto en el código:**
Se eliminó el estado `editSchedules` y sus 5 setters (quedaron sin lecturas al quitar la tabla) y los imports muertos (`Separator`, `Table`, `DialogFooter`, `Coffee`).

### Tags clicables con `startEdit(barber, schedule)`

**Qué se decidió:**
Los tags de horarios en las cards son `Button` outline; al hacer click llaman `startEdit(barber, schedule)` con `e.stopPropagation()` (defensivo, quedó redundante tras quitar el onClick del card).

**Por qué se tomó esta decisión:**
Los tags viven en las cards, fuera del modal, así que la firma original (`startEdit(schedule)`, solo setter de form) no abría el modal. Extensión mínima para cumplir "al hacer click en un tag abre el modal en modo edición".

**Alternativas descartadas:**
- Abrir el modal desde la card completa: el plan pidió explícitamente quitar el onClick global.

**Impacto en .docs:** Ninguno.

**Impacto en el código:** Firma ampliada de `startEdit`; el modal se abre con `setDialogOpen(true)` desde el tag.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `reports/2026-08-15_pagina-horarios-cards_iter1.md` | Reporte de ejecución + auditoría de la iteración | — |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/components/ui/dialog.tsx` | Prop `maxWidth` con default `sm:max-w-sm`; base sin clase de ancho; `cn(baseClasses, maxWidth, className)` | Corregir bug de ancho del modal de horarios de forma retrocompatible |
| `frontend/src/app/(dashboard)/admin/schedules/page.tsx` | Cards + búsqueda + paginado + tags clicables + modal solo formulario + botón Eliminar | Objetivo principal de la iteración |
| `frontend/src/app/(dashboard)/admin/schedules/page.test.tsx` | 10 tests (render, crear multi-día, tag→edición, update, error, búsqueda, paginado, eliminar, modal sin tabla) | Cubrir el nuevo comportamiento |

### Archivos eliminados

| Archivo | Motivo de eliminación |
|---------|----------------------|
| (ninguno) | — |

---

## Cambios en archivos clave

### `frontend/src/components/ui/dialog.tsx`

**Antes:** `DialogContent` tenía `sm:max-w-sm` fijo en su clase base; todos los modales dependían de ese ancho por defecto o lo sobreescribían con `className`.
**Después:** acepta `maxWidth?: string` (default `sm:max-w-sm`); se compone con `cn(baseClasses, maxWidth, className)` — con `twMerge`, `className` gana sobre `maxWidth`, por lo que los 13 usos existentes conservan su ancho.
**Por qué es importante:** es un componente base de shadcn usado en todo el dashboard; cualquier cambio mal compuesto rompería el layout de todos los modales del sistema.

### `frontend/src/app/(dashboard)/admin/schedules/page.tsx`

**Antes:** tabla de horarios con filas clickables, modal con tabla interna y ancho fijo 820px.
**Después:** cards con búsqueda (name/email case-insensitive con reset de página), paginado 5/página (solo visible con `totalPages > 1`, con `safePage` contra fuera de rango), icono Pencil con `aria-label` para crear, tags clicables para editar, modal solo formulario con `maxWidth="sm:max-w-[1000px]"` y botón "Eliminar" en modo edición (con `try/catch` y mensaje de error).
**Por qué es importante:** es la página de gestión de horarios del administrador (MVP); la lógica de break (ADR-011) y validaciones multi-día (ADR-008) deben permanecer intactas — verificadas por el Auditor.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Cards con búsqueda por nombre/email y reset de página | Cumplido | Auditoría criterio 4 (paso 3) + test "filtra por nombre y email y resetea la página" |
| Paginado de 5 por página, solo con >5 resultados | Cumplido | Auditoría criterio 4 (paso 4) + test de paginado; `safePage` previene fuera de rango |
| Tags clicables abren el modal en modo edición (día bloqueado, horas editables) | Cumplido | Auditoría criterio 4 (pasos 5-6) + test "tag → modo edición" |
| Modal solo formulario (sin tabla, sin DialogFooter/Cerrar) | Cumplido | Auditoría criterio 4 (paso 7) + test "no muestra la tabla..." |
| `maxWidth` retrocompatible (13 usos intactos) | Cumplido | Auditoría criterio 5: verificado con `cn()`/`twMerge`; 12 usos con clase propia, 1 conserva default idéntico |
| ADR-011 (break) y ADR-008 (multi-día) intactos | Cumplido | Auditoría criterio 3 (ADR-011 L169-184 intacto; `max-h` + scroll conservados) |
| `tsc --noEmit` exit 0 | Cumplido | Re-ejecutado por el Auditor |
| ESLint 0 problemas en archivos tocados | Cumplido | Re-ejecutado por el Auditor (3 archivos) |
| Suite `schedules/page.test` 10/10 | Cumplido | Re-ejecutada por el Auditor (`npx jest --testPathPatterns "schedules/page.test"`) |
| Fallos de lint/test globales son pre-existentes y ajenos | Cumplido | Auditoría criterio 7: verificados con `rg` + `git status`; suite `services` falla por `Toast.Provider` (ya documentada en iteración previa) |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | `e.stopPropagation()` redundante en tags de horarios (código muerto defensivo, quedó sin efecto tras quitar el onClick global del card) | BAJA | `frontend/src/app/(dashboard)/admin/schedules/page.tsx` (L390-391) | Limpiar cuando se vuelva a tocar la página |
| 2 | Fallos pre-existentes: `npm run lint` → 4 errores + 3 warnings en `admin/landing/page.tsx`, `BookingWizard.tsx`, `LandingGallery.tsx`, `use-availability.ts`, `use-public-data.ts`, `use-tenant-name.ts` | MEDIA | archivos ajenos listados | Pendiente de una iteración de limpieza (deuda acumulada documentada desde iteraciones previas) |
| 3 | Suite `admin/services/page.test.tsx` falla: `useToastManager must be used within <Toast.Provider>` | MEDIA | `admin/services/page.test.tsx` | Pendiente; pre-existente, documentada en iteraciones previas |
| 4 | Métrica "251 communities" del reporte no verificable (artefacto stale de graphify) | BAJA | `reports/2026-08-15_pagina-horarios-cards_iter1.md` | Cosmético; nodes/edges del graph coinciden exactamente |

---

## Lo que el programador debe saber

- **El ciclo quedó cerrado**: esta iteración se había quedado detenida tras la fase EXECUTOR; se reanudó, se auditó (APROBADO CON OBSERVACIONES) y se generó este reporte final.
- **Cambios pendientes de commit**: hay 3 archivos modificados sin commitear (`dialog.tsx`, `schedules/page.tsx`, `schedules/page.test.tsx`) más el reporte nuevo. El Orquestador no autoriza commits por sí solo; si deseas, autoriza el commit y los hago.
- **Convención nueva que hay que mantener**: los modales que necesiten un ancho distinto al default `sm:max-w-sm` deben usar la prop `maxWidth` (ej. `maxWidth="sm:max-w-[1000px]"`) en lugar de hardcodear `max-w-[...]` en `className`. Mantener `maxWidth` antes de `className` en `cn()` es esencial para la retrocompatibilidad.
- **Desvíos del plan (todos validados como razonables por el Auditor)**: se eliminó el estado `editSchedules` (quedó sin lecturas), `startEdit` cambió de firma para abrir el modal, el botón Eliminar cierra el modal explícitamente, y el test de paginado se ajustó porque "Página 1 de 1" no se renderiza por diseño.
- **Los fallos de lint/test globales NO son de esta iteración**: 4 errores + 3 warnings de lint y la suite `admin/services` ya estaban documentados en la iteración anterior (modal horarios multi-día).
- **`graphify update .` ejecutado**: el knowledge graph se regeneró (3700 nodes, 6142 edges).

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-15_pagina-horarios-cards_iter1.md` |
