# Reporte Técnico Final
## Convertir el detalle de cita en un modal (admin + barber) y eliminar las vistas de detalle

> **Generado:** 2026-07-31
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2 / React 19 / TypeScript 5 / Tailwind / shadcn-ui + @base-ui/react (frontend) · NestJS 10 / TypeORM / PostgreSQL (backend)
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

**Objetivo:** Reemplazar las vistas de detalle de cita (admin y barber) por un modal que se abre desde la tabla de citas del admin y desde el dashboard del barbero. El modal muestra la información con los **nombres** (barber, cliente, servicio), nunca los IDs.

**Éxito cuando:**
- Existe un modal (Dialog) de detalle de cita reutilizable que muestra: estado, inicio, fin, `barber.name`, `customer.name`, `service.name`, notas, y las acciones (Completar/Cancelar según rol y estado).
- La tabla `/admin/appointments` abre el modal al pulsar "Ver" (sin navegación de página).
- El dashboard del barbero abre el modal al pulsar una cita.
- Se eliminan las rutas `/admin/appointments/[id]` y `/barber/appointments/[id]`.
- No se muestra ningún ID (ni barberId, customerId ni serviceId).
- `tsc --noEmit` y `npm run build` pasan; lint sin errores nuevos en líneas nuevas.

**Fuera de alcance:**
- Backend (ya devuelve los nombres — no se modifica).
- `.docs` (no se modifica).
- Arreglo del lint global pre-existente.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | ⚠️ APROBADO CON OBSERVACIONES | — (ninguna; observaciones BAJA pre-existentes) |

---

## Decisiones técnicas tomadas

### 1. Componente de modal único compartido (admin + barber)

**Qué se decidió:**
Crear `frontend/src/components/appointments/appointment-detail-dialog.tsx`, un solo componente `"use client"` reutilizado por la tabla admin y el dashboard barber. Controlado por props (`appointmentId`, `open`, `onOpenChange`, `allowCancel?`, `onStatusChange?`), carga el detalle con `getById` y ejecuta `complete()`/`cancel()` condicionalmente.

**Por qué se tomó esta decisión:**
La vista de detalle es idéntica entre roles (estado, inicio, fin, barber, cliente, servicio, notas); la única diferencia es la acción Cancelar (solo admin). Un solo componente = una sola fuente de verdad de layout/estados, menos duplicación y mantenimiento. La diferenciación por rol se resuelve con la prop booleana `allowCancel` — coherente con PROJECT.md (el barber solo "Mark appointments as completed"; cancelar es permiso del administrator).

**Alternativas descartadas:**
- Dos modales separados (uno por rol): duplicaría layout y estados sin beneficio.
- Modal controlado por `DialogTrigger`: ambos anfitriones abren desde un botón/fila, por lo que el control por `open`/`onOpenChange` es más limpio.

**Impacto en .docs:**
Sin cambios requeridos; `architecture/modules.md` prevé componentes compartidos en `src/components/`.

**Impacto en el código:**
El modal es la única superficie de detalle; cualquier ajuste futuro de layout/acciones se hace en un solo lugar.

### 2. Eliminación completa de las rutas `[id]`

**Qué se decidió:**
Borrar `admin/appointments/[id]/page.tsx`, `barber/appointments/[id]/page.tsx` y el directorio `barber/appointments/` (quedó vacío). La ruta `/admin/appointments/new` NO se tocó.

**Por qué se tomó esta decisión:**
El usuario lo pidió explícitamente ("elimina la ruta, que el modal se muestre desde la tabla"). El contenido era demasiado corto para justificar una vista/página propia.

**Alternativas descartadas:**
- Conservar las rutas para deep-linking/recarga directa: contradice el pedido explícito y dejaba páginas huérfanas.

**Impacto en .docs:**
Sin cambios.

**Impacto en el código:**
Se pierde el deep-linking y la recarga directa del detalle (trade-off del patrón modal, documentado como deuda). Verificado con grep: 0 referencias rotas a las rutas eliminadas.

### 3. Regla dura: nunca mostrar IDs (ni crudos ni truncados)

**Qué se decidió:**
En el modal y en las tablas, los nombres se muestran con `barber?.name ?? "—"`, `customer?.name ?? "—"`, `service?.name ?? "—"`. Se eliminaron los fallbacks con `slice(0, 8)` que quedaban en la tabla admin y los `customerId`/`serviceId` crudos del dashboard barber.

**Por qué se tomó esta decisión:**
Criterio de éxito explícito del usuario ("no muestres los ids, muestra la información, los nombres"). El fallback pasa a ser el placeholder neutro `"—"`.

**Alternativas descartadas:**
- Mantener `slice(0, 8)` como fallback: violaba el criterio de no mostrar IDs.

**Impacto en .docs:**
Sin cambios.

**Impacto en el código:**
Ninguna superficie de citas imprime IDs. Si el backend algún día dejara de poblar relaciones, se mostraría `"—"` en lugar de IDs.

### 4. Estado derivado para loading (desviación menor del plan)

**Qué se decidió:**
En lugar de `setLoading(true)` dentro del `useEffect` (que disparaba `react-hooks/set-state-in-effect`), se implementó el estado de carga derivado con `loadedId`: `loading = open && appointmentId !== null && loadedId !== appointmentId && error === null`.

**Por qué se tomó esta decisión:**
Evita introducir un error de lint nuevo en líneas nuevas, respetando las reglas del repo. Comportamiento visual idéntico al plan (auditado por el Auditor en todos los flujos).

**Alternativas descartadas:**
- `setLoading` en el efecto: rompía lint.
- `useMemo`/dependencias adicionales: innecesario.

**Impacto en .docs:**
Sin cambios.

**Impacto en el código:**
Mismo comportamiento funcional; lógica de carga ligeramente más declarativa.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `frontend/src/components/appointments/appointment-detail-dialog.tsx` | Modal compartido de detalle de cita (admin + barber) | Modal único compartido |
| `reports/2026-07-31_modal-detalle-cita_iter1.md` | Reporte de ejecución + auditoría | Registro del ciclo |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/app/(dashboard)/admin/appointments/page.tsx` | Botón "Ver" abre modal vía `selectedId` (sin Link); celdas Barber/Cliente/Servicio con `?? "—"` en vez de `slice(0,8)`; modal con `allowCancel` | Integrar modal y eliminar IDs |
| `frontend/src/app/(dashboard)/barber/dashboard/page.tsx` | Botón ChevronRight abre modal (sin Link); celdas con `customer?.name`/`service?.name` en vez de IDs; se eliminó `import Link` (sin uso); modal sin `allowCancel` | Integrar modal y eliminar IDs |

### Archivos eliminados

| Archivo | Motivo de eliminación |
|---------|----------------------|
| `frontend/src/app/(dashboard)/admin/appointments/[id]/page.tsx` | Reemplazada por el modal (pedido explícito) |
| `frontend/src/app/(dashboard)/barber/appointments/[id]/page.tsx` | Reemplazada por el modal (pedido explícito) |
| directorio `frontend/src/app/(dashboard)/barber/appointments/` | Quedó vacío tras eliminar la ruta |

---

## Cambios en archivos clave

### `frontend/src/components/appointments/appointment-detail-dialog.tsx` (nuevo)

**Antes:** no existía.
**Después:** modal con `Dialog` de `@base-ui/react` (vía `components/ui/dialog.tsx`). Props `appointmentId/open/onOpenChange/allowCancel?/onStatusChange?`. Carga `getById`, muestra Inicio/Fin/Barber/Cliente/Servicio/Estado/Notas con nombres (fallback `"—"`), botones Completar (si `scheduled`) y Cancelar (si `allowCancel && scheduled`), ambos con `disabled={isSubmitting}`.
**Por qué es importante:** es la única superficie de detalle de cita del sistema; centraliza el layout y las acciones de cambio de estado.

### `frontend/src/app/(dashboard)/admin/appointments/page.tsx`

**Antes:** botón "Ver" era `<Link>` a `/admin/appointments/${id}`; celdas con `barber?.name ?? barberId.slice(0, 8)`.
**Después:** botón "Ver" abre el modal con `setSelectedId(apt.id)`; celdas con `?? "—"`; modal con `allowCancel` y `onStatusChange` que actualiza la tabla.
**Por qué es importante:** la tabla principal de citas ya no navega a una página huérfana y no expone fragmentos de ID.

### `frontend/src/app/(dashboard)/barber/dashboard/page.tsx`

**Antes:** celdas con `customerId`/`serviceId` crudos; `<Link>` a `/barber/appointments/${id}`.
**Después:** celdas con `customer?.name`/`service?.name`; `<button>` con ChevronRight abre el modal; modal sin `allowCancel` (el barber no cancela).
**Por qué es importante:** el dashboard del barbero muestra nombres legibles y el detalle se abre sin salir de la agenda.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Modal reutilizable con estado/inicio/fin/nombres/notas + acciones por rol/estado | ✅ Cumplido | `appointment-detail-dialog.tsx:101-163` |
| `/admin/appointments` abre modal al pulsar "Ver" sin navegación | ✅ Cumplido | `admin/appointments/page.tsx:77-93` |
| Dashboard barber abre modal al pulsar cita | ✅ Cumplido | `barber/dashboard/page.tsx:156-179` |
| Rutas `[id]` eliminadas; `/new` intacta | ✅ Cumplido | Glob + build (24 rutas, sin `[id]`) |
| No se muestra ningún ID (ni crudo ni fragmento) | ✅ Cumplido | `?? "—"` + `?.name`; grep `slice`/`*.Id` en tsx: 0 |
| tsc/build PASS; lint sin errores en líneas nuevas | ✅ Cumplido | tsc exit 0, build exit 0, modal 0 hallazgos |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | Lint global roto pre-existente (15 errores, 18 warnings en ~10 archivos ajenos: `order-time.tsx`, `auth-context.tsx`, `branches/[id]`, `barber/schedule/*`, `super-admin/tenants/*`, etc.) | MEDIA | Múltiples (no introducido por este cambio) | Antes de nuevas features |
| 2 | `as any` pre-existente en `admin/appointments/page.tsx:71:60` (Badge) — recomendable tipar `statusColor` con `as const` como ya hace el modal | BAJA | `admin/appointments/page.tsx` | Baja prioridad |
| 3 | Import `Button` sin usar en `barber/dashboard/page.tsx:5:10` (pre-existente) | BAJA | `barber/dashboard/page.tsx` | Baja prioridad |
| 4 | Deep-linking / recarga directa al detalle de cita ya no disponible (trade-off del patrón modal) | BAJA | — | Baja prioridad (documentar) |
| 5 | El conteo de errores de lint bajó de 17 a 15 (beneficio colateral: las páginas eliminadas arrastraban `no-explicit-any`) | INFO | — | — |

---

## Lo que el programador debe saber

- El detalle de cita ahora es un **modal** desde la tabla admin (botón "Ver") y desde el dashboard del barbero (ChevronRight). Las páginas `/admin/appointments/[id]` y `/barber/appointments/[id]` fueron **eliminadas** por completo.
- **Ninguna superficie muestra IDs**: ni crudos ni fragmentos; todo usa los nombres con fallback `"—"`.
- **El barbero NO ve el botón Cancelar** (solo Completar), coherente con PROJECT.md; el admin ve Completar y Cancelar (solo para citas `scheduled`).
- El modal usa el `Dialog` de `@base-ui/react` (no Radix), acorde a la convención del repo.
- **Convención nueva:** componentes de dominio compartidos viven en `src/components/<dominio>/` (ej. `appointments/appointment-detail-dialog.tsx`).
- El lint del repo sigue roto por deuda pre-existente (15 errores en archivos ajenos). Este cambio **no añade** errores de lint; el modal tiene 0 hallazgos.
- Se perdió el deep-linking al detalle; si en el futuro se necesita URL directa, habría que evaluar rutas paralelas de Next.js o restablecer `[id]` con redirección al modal.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-07-31_modal-detalle-cita_iter1.md` |
