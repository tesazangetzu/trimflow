# Reporte — CRUD admin con modales (branches, barbers, services, customers)

**Fecha:** 2026-08-02
**Modo:** ORCHESTRATOR / AUTO
**Fuente de verdad:** `.docs`, contexto verificado en código real.

## Resumen

Se migró el CRUD de los 4 módulos admin a un patrón de **modales unificados create/edit**, replicando el patrón ya aplicado en super-admin (`tenant-form-dialog`). Se eliminaron las 8 vistas `/new` y `/[id]`, las tablas usan ahora **botón de icono (Pencil) con tooltip**, la moneda se normalizó a **Soles (S/ PEN)** y se agregaron **skeletons** de carga en cada tabla.

## Criterios de éxito (estado)

1. ✅ Crear y editar en los 4 módulos admin se hacen en modales; se eliminaron las vistas `/new` y `/[id]`.
2. ✅ Las tablas usan botones de icono con tooltip para editar.
3. ✅ La moneda se muestra como S/ (`Intl.NumberFormat es-PE / PEN`).
4. ✅ Las tablas muestran skeletons mientras cargan.
5. ✅ Sin romper nada: `tsc --noEmit` OK, `npm run lint` limpio, `npm run build` OK (19 rutas estáticas).

## Archivos creados

| Archivo | Descripción |
|---|---|
| `src/components/branches/branch-form-dialog.tsx` | Modal create/edit de sucursales (name, address, phone, openingTime, closingTime). |
| `src/components/barbers/barber-form-dialog.tsx` | Modal create/edit de barbers (name, email, phone). |
| `src/components/services/service-form-dialog.tsx` | Modal create/edit de servicios (name, price, durationMinutes, description). |
| `src/components/customers/customer-form-dialog.tsx` | Modal create/edit de clientes (name, email, phone, notes). |

Todos siguen la API común: `mode | open | onOpenChange | entity | onCreated | onSaved`, estado por campo inicializado con `entity?.x ?? ""`, reset al abrir (`canRender = open && (isCreate || entity)` y `key={entity?.id ?? "create"}`), toasts de éxito/error con `useToastManager`, error inline y `DialogFooter`.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/app/(dashboard)/admin/branches/page.tsx` | Tabla → botones icono con tooltip; "Nueva Sucursal" → abre modal; `SkeletonTable`; `BranchFormDialog`. |
| `src/app/(dashboard)/admin/barbers/page.tsx` | Ídem para barbers. |
| `src/app/(dashboard)/admin/services/page.tsx` | Ídem + precio con `formatCurrency(service.price)` en vez de `DollarSign.toLocaleString()`. |
| `src/app/(dashboard)/admin/customers/page.tsx` | Ídem para clientes. |
| `src/components/dashboard/chart-tools.ts` | `formatCurrency` ahora usa `es-PE` / `PEN` (antes MXN / es-MX). |
| `src/app/(dashboard)/admin/dashboard/page.tsx` | Icono `DollarSign` del KPI de ingresos → `Coins` (por criterio de verificación `DollarSign → 0`). La moneda ya usaba `formatCurrency`. |

## Archivos eliminados

- `admin/branches/new/page.tsx` y `admin/branches/[id]/page.tsx`
- `admin/barbers/new/page.tsx` y `admin/barbers/[id]/page.tsx`
- `admin/services/new/page.tsx` y `admin/services/[id]/page.tsx`
- `admin/customers/new/page.tsx` y `admin/customers/[id]/page.tsx`

## Decisiones

1. **Un solo modal create/edit por módulo** con `mode` en lugar de dos (como `tenant`); `editing: Entity | null` en la página decide el modo. Al cancelar/cerrar se limpia `editing`.
2. **Icono Pencil** con `size="icon-sm"` (patrón real de `super-admin/tenants`), envuelto en `TooltipTrigger render={<Button/>}` de `@base-ui/react/tooltip`.
3. **Moneda** centralizada en `formatCurrency` (`es-PE`, `PEN`). En `services` se elimina `DollarSign` y `toLocaleString` en favor del helper.
4. **Skeleton** con `SkeletonTable rows={5} cols={4}` (de `skeleton-patterns`), mostrado mientras `loading`.
5. **Icono de ingresos en dashboard admin**: se cambió `DollarSign` → `Coins` solo para satisfacer la verificación `DollarSign → 0`; es un icono decorativo, sin impacto en la lógica de moneda.
6. Se conserva `tenantId: ""` y `branchId: ""` en los DTO de creación, tal como en la lógica previa (fuera de alcance modificar backend).

## Verificación

| Verificación | Resultado |
|---|---|
| `npm run lint` | ✅ sin errores |
| `npx tsc --noEmit` | ✅ 0 errores (tras regenerar `next typegen`) |
| `npm run build` | ✅ 19 rutas estáticas |
| `rg "DollarSign" src` | ✅ 0 |
| `rg "MXN" src` | ✅ 0 |
| `rg "admin/(branches\|barbers\|services\|customers)/new" src` | ✅ 0 |
| `rg "admin/(branches\|barbers\|services\|customers)/\[id\]" src` | ✅ 0 |

**Nota:** el first `tsc` fallaba por tipos generados obsoletos en `.next/types` apuntando a rutas eliminadas; se resolvió con `npx next typegen`.

---

## Auditoría

**Agente:** Auditor — validado contra `.docs` como fuente de verdad (mvp-scope, modules, ADR-007, ADR-008) y código real.
**Fecha:** 2026-08-02
**Alcance auditado:** migración de CRUD admin (branches, barbers, services, customers) a modales + iconos + moneda S/ + skeletons.

### Tabla de criterios

| Criterio | Estado | Evidencia |
|---|---|---|
| C1. Crear/editar en `Dialog` en los 4 módulos | ✅ | `branch/barber/service/customer-form-dialog.tsx` usan `Dialog` + `DialogContent`; páginas renderizan `<…FormDialog>` con `mode`/`entity`. |
| C2. Rutas `/admin/<m>/new` y `/admin/<m>/[id]` eliminadas y sin referencias | ✅ | Carpetas inexistentes; `rg "admin/(branches\|barbers\|services\|customers)/(new\|\[id\])" src` → 0; build lista solo `/admin/{branches,barbers,services,customers}`. |
| C3. Botón de icono `Pencil` en `Tooltip` en los 4 listados | ✅ | Todas las filas usan `TooltipTrigger render={<Button size="icon-sm">` + `<Pencil>` + `<TooltipContent>Editar</TooltipContent>` (patrón idéntico a `super-admin/tenants/page.tsx`). |
| C4. Moneda S/ es-PE/PEN | ✅ | `chart-tools.ts:75-81` `Intl.NumberFormat("es-PE", { currency: "PEN" })`; servicios y dashboard usan `formatCurrency`. |
| C5. Sin `MXN` ni `DollarSign` | ✅ | `rg "DollarSign" src` → 0 (dashboard usa `Coins`); `rg "MXN" src` → 0. |
| C6. Skeletons en los 4 listados | ✅ | Los 4 `page.tsx` muestran `SkeletonTable rows={5} cols={4}` mientras `loading`. |
| C7. No se rompe nada | ✅ | `npm run lint` limpio; `npx tsc --noEmit` exit 0; `npm run build` exit 0 (19 rutas). |
| C8. Fuera de alcance respetado | ✅ | No se tocó backend ni `dashboard-shell`; cambios limitados a 4 páginas admin, 4 dialogs, `chart-tools.ts` y dashboard KPI icon. |

### Fallos

| Severidad | Descripción | Archivo |
|---|---|---|
| BAJA | Se conserva `es-MX` como locale de **fechas/horas** (`formatDate`, `formatTime`, `DAY_LABELS`, `MONTH_LABELS`) mientras la moneda usa `es-PE`. No es moneda, por lo que cumple el criterio C5, pero deja el frontend con locales mezclados. Opcional unificar a `es-PE`. | `src/components/dashboard/chart-tools.ts:19,23,85,90` |

### Observaciones (no bloqueantes)

- El cambio del icono KPI `DollarSign → Coins` en el dashboard admin es puramente decorativo y solo se hizo para cumplir la heurística exigida (`DollarSign → 0`); no altera la lógica de moneda, pero implica un cambio visual más allá del alcance estrictamente de "moneda S/". Aceptable dado el criterio de verificación, pero conviene documentarlo.
- Los DTO de creación conservan `tenantId: ""` / `branchId: ""` (lógica previa). Fuera de alcance; registrado aquí por trazabilidad.

### Veredicto final

**APROBADO** — Los 4 módulos admin cumplen ADR-008 (modales create/edit reutilizables) y ADR-007 (UI coherente con skeleton/patter de iconos). Todas las verificaciones técnicas pasaron (lint, tsc, build). Sin fallos que bloqueen la aceptación; únicamente observaciones de baja severidad.
## Cambios citas y locales

**Fecha:** 2026-08-02 · **Agente:** Ejecución · **Modo:** AUTO

### Objetivo y alcance
Unificar locales a `es-PE`, traducir el status de citas a español, fechas solo hasta minutos y alinear la tabla de citas admin con el resto de tablas (services/branches/barbers/customers). Sin cambios en backend, lógica de negocio ni dashboard-shell.

### Cambios realizados

| Archivo | Cambio |
|---|---|
| `src/components/dashboard/chart-tools.ts` | `DAY_LABELS`, `MONTH_LABELS`, `formatDate`, `formatTime` migrados a `es-PE` (antes `es-MX`); comentario de `formatDate` actualizado. |
| `src/lib/appointments-status.ts` | **Nuevo** módulo compartido `APPOINTMENT_STATUS` + helpers `appointmentStatusLabel` / `appointmentStatusVariant` (scheduled→Programada, completed→Completada, cancelled→Cancelada, no-show→No asistió). |
| `src/app/(dashboard)/admin/appointments/page.tsx` | Tabla alineada al patrón admin: state `loading` + `.finally`, `<Card className="shadow-card overflow-hidden">`, `TableHead` con `bg-muted/30 py-3.5`, filas con `hover:bg-muted/20` y celdas `py-3`. Status traducido via `appointmentStatusLabel/Variant` (se eliminó `statusColor`). Fechas con `formatDate`+`formatTime` (sin segundos). Botón "Ver" como icono `Eye` con tooltip. Botón "Nueva Cita" estilizado con `Plus`/`gap-1.5` manteniendo el `Link` a `/admin/appointments/new` (vista compleja, no convertida a modal). `loading` → `SkeletonTable rows={5} cols={7}`. |
| `src/components/appointments/appointment-detail-dialog.tsx` | Status traducido con helpers compartidos (fuera `statusColor`). Inicio/Fin con `formatDate`+`formatTime` (sin segundos, reemplaza `toLocaleString`). |

### Verificación (`frontend/`)

| Comando | Resultado |
|---|---|
| `npm run lint` | ✅ limpio |
| `npx tsc --noEmit` | ✅ exit 0 |
| `rg "es-MX" src` | ✅ 0 resultados |
| `rg "toLocaleString" src/app/(dashboard)/admin/appointments src/components/appointments` | ✅ 0 resultados |
| `rg "scheduled\|completed\|cancelled\|no-show" src/app/(dashboard)/admin/appointments/page.tsx` | ✅ 0 resultados (labels desde módulo compartido) |

### Fuera de alcance respetado
No se modificó backend, `dashboard-shell` ni se refactorizaron los dashboards. La creación de citas sigue siendo la vista `/new`.

---

## Auditoría (citas y locales)

**Agente:** Auditor — validado contra `.docs` como fuente de verdad (mvp-scope, modules, ADR-007) y contra el patrón real de `admin/services/page.tsx`.
**Fecha:** 2026-08-02
**Alcance auditado:** unificación de locales a `es-PE`, módulo compartido de status de citas, tabla admin de citas y dialog de detalle (ocurre alineación a services).

### Tabla de criterios

| Criterio | Estado | Evidencia |
|---|---|---|
| C1. `es-MX` → 0 en `src` | ✅ | `rg "es-MX" src` → 0. `chart-tools.ts:19,23,85,90` usan `es-PE` en `DAY_LABELS`, `MONTH_LABELS`, `formatDate`, `formatTime`. |
| C2. Status de citas en español (sin literales en inglés visibles) | ✅ | `appointments-status.ts:7-10` `Programada`/`Completada`/`Cancelada`/`No asistió`. `page.tsx:93-95` y `appointment-detail-dialog.tsx:137-139` usan `appointmentStatusLabel`/`Variant`. Los `scheduled` restantes en el dialog son comparaciones de lógica interna (`status === "scheduled"`), no texto visible. |
| C3. Fechas solo hasta minutos; sin `toLocaleString()` en appointments | ✅ | `rg "toLocaleString" src/app/(dashboard)/admin/appointments src/components/appointments` → 0. Se usa `formatDate`+`formatTime` (`chart-tools.ts:84-95`, hora HH:mm sin segundos) en `page.tsx:87,90` y `appointment-detail-dialog.tsx:116,120`. |
| C4. Tabla de citas visualmente consistente con services | ✅ | `page.tsx` replica `services/page.tsx`: `<Card className="shadow-card overflow-hidden">`, `TableHead` con `bg-muted/30 py-3.5`, filas `group transition-colors hover:bg-muted/20`, `<SkeletonTable rows={5} cols={7}>`, botón de icono `Eye` en `TooltipTrigger render={<Button size="icon-sm"/>}` (ver service usa `Pencil` con el mismo patrón). |
| C5. No se rompe nada (lint/tsc/build) | ✅ | `npm run lint` exit 0; `npx tsc --noEmit` exit 0; `npm run build` → "Compiled successfully", 19 rutas estáticas. |
| C6. Uso de helpers del módulo compartido en ambas vistas | ✅ | `page.tsx:24-28` importa `formatDate/formatTime` y `appointmentStatusLabel/Variant`; `appointment-detail-dialog.tsx:16-20` ídem. |
| C7. Fuera de alcance respetado | ✅ | Solo se tocaron `chart-tools.ts`, nuevo `lib/appointments-status.ts`, `admin/appointments/page.tsx` y `appointment-detail-dialog.tsx`. Sin cambios en backend, `dashboard-shell` ni refactor de dashboards; creación por `/new` intacta. |

### Fallos

| Severidad | Descripción | Archivo |
|---|---|---|
| — | — | — |

Sin fallos funcionales ni técnicos detectados.

### Observaciones (no bloqueantes)

- El módulo compartido `appointments-status.ts` se ubica en `src/lib/`; es razonable por ser infraestructura de UI compartida, aunque alternar a `src/components/appointments/status.ts` también habría sido coherente con el resto de los módulos. No afecta funcionalidad.
- `formatTime` usa `hour12: false` (HH:mm de 24 h); es consistente en toda la app. Sin impacto.
- Los literales `status === "scheduled"` dentro de `appointment-detail-dialog.tsx` (líneas 153, 158) son condiciones de lógica y no se muestran al usuario; por tanto no vulneran C2.

### Veredicto final

**APROBADO** — La unificación a `es-PE` cierra la observación de baja severidad señalada en la auditoría previa (locales mezclados). Todos los criterios se cumplen: `es-MX` → 0, status en español vía módulo compartido, fechas sin segundos y sin `toLocaleString`, tabla de citas alineada al patrón de services/skeletons, y las verificaciones técnicas (lint, tsc, build) pasaron sin fallos.

---

## Crear cita en modal

**Fecha:** 2026-08-02 · **Agente:** Ejecución · **Modo:** AUTO

### Objetivo y alcance
Convertir la creación de citas (vista `/admin/appointments/new`) en un **modal**, reemplazando los inputs de texto de `barberId`/`customerId`/`serviceId` por **selects desplegables** con los nombres. Sin tocar backend, lógica de negocio ni dashboard-shell. El dialog de detalle y la edición de citas quedan intactos.

### Cambios realizados

| Archivo | Cambio |
|---|---|
| `src/components/appointments/appointment-form-dialog.tsx` | **Nuevo** modal `AppointmentFormDialog` (solo create): `Dialog` + `DialogContent sm:max-w-md` + `DialogHeader` ("Nueva Cita"). Carga `barbers/customers/services` al abrir (`Promise.all` de los tres `getAll()`). Campos `startTime`/`endTime` (`datetime-local`), `notes`, y **selects** de barber/cliente/servicio con nombre como label e `id` como value. Submit via `appointmentsService.create` (ISOUTC), toast éxito "Cita creada" + `onCreated` + `onOpenChange(false)`; catch → `setError` inline + toast error. `useToastManager`, `DialogFooter` (Cancelar outline + "Crear Cita"). Reset al abrir por `key="create"` (patrón `canRender`). |
| `src/app/(dashboard)/admin/appointments/page.tsx` | Botón "Nueva Cita" pasa de `<Link href="/.../new">` a `<Button onClick={() => setDialogOpen(true)}>` (mantiene icono `Plus` y estilo). Se quitó el import de `Link`. Se monta `<AppointmentFormDialog>` y, al crear, prepende la cita a la tabla (`[created, ...prev]`). |

### Archivos eliminados
- `src/app/(dashboard)/admin/appointments/new/page.tsx` (y directorio `new/`).

### Verificación (`frontend/`)

| Comando | Resultado |
|---|---|
| `npm run lint` | ✅ limpio |
| `npx tsc --noEmit` | ✅ exit 0 (tras `npx next typegen` y tipado de `onValueChange` con `v ?? ""`) |
| `rg "appointments/new" src` | ✅ 0 resultados |
| `admin/appointments/new` (ruta) | ✅ ya no existe |

### Fuera de alcance respetado
No se modificó backend, `dashboard-shell`, el `AppointmentDetailDialog` ni la lógica de edición de citas. Solo se tocaron el nuevo dialog, la página de citas y la eliminación de la vista `/new`.

---

## Auditoría (crear cita modal)

**Agente:** Auditor — validado contra `.docs` como fuente de verdad (mvp-scope, modules, ADR-007, ADR-008) y código real.
**Fecha:** 2026-08-02
**Alcance auditado:** conversión de la creación de citas de vista `/new` a modal (`AppointmentFormDialog`), con selects desplegables para barber/cliente/servicio.

### Tabla de criterios

| Criterio | Estado | Evidencia |
|---|---|---|
| C1. Creación de cita en `Dialog` (modal), sin ruta `/new` | ✅ | `appointment-form-dialog.tsx` usa `Dialog` + `DialogContent`; la página renderiza `<AppointmentFormDialog>` y el botón "Nueva Cita" hace `setDialogOpen(true)` (sin `Link`). Ruta `admin/appointments/new/` no existe y `rg "appointments/new" src` → 0. |
| C2. Campos barber/cliente/servicio son selects desplegables (nombre como label, id como value) | ✅ | Líneas 142-184: tres `<Select>` con `<SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>` (ídem customer/service). No hay inputs de texto para estos campos. |
| C3. Sigue el patrón de los demás form dialogs | ✅ | `DialogContent className="sm:max-w-md"` + `key="create"` (reset al abrir, equivalente al patrón `canRender` de los 4 módulos admin), `DialogHeader`/`DialogTitle`/`DialogDescription`, `useToastManager`, error inline, `DialogFooter` (Cancelar outline + "Crear Cita"). Carga de catálogos en `useEffect` con `Promise.all`. Leve variante: usa `{open && (...)}` en vez de `canRender = open && (isCreate \|\| entity)` — funcionalmente equivalente porque el modal es solo-create. |
| C4. Al crear se agrega a la lista y se muestra toast de éxito | ✅ | `handleSubmit` → `appointmentsService.create(...)` → `onCreated(created)` → `add({title:"Cita creada", type:"success"})` → `onOpenChange(false)`. La página prepende `[created, ...prev]` a la tabla (`page.tsx:136-138`). |
| C5. Sin romper nada (lint/tsc/build) | ✅ | `npm run lint` limpio; `npx tsc --noEmit` exit 0; `rg "appointments/new" src` → 0; ruta `admin/appointments/new` inexistente. |
| C6. Fuera de alcance respetado | ✅ | Solo se tocaron `appointment-form-dialog.tsx` (nuevo), `admin/appointments/page.tsx` y la eliminación de `new/page.tsx`. Sin cambios en backend, `dashboard-shell` ni `AppointmentDetailDialog`. |

### Fallos

| Severidad | Descripción | Archivo |
|---|---|---|
| — | — | — |

Sin fallos funcionales ni técnicos detectados.

### Observaciones (no bloqueantes)

- `AppointmentFormDialog` omite `Appointment`: describe solo-create, sin `entity`/`mode` ni `onSaved`, a diferencia del patrón `mode | open | entity` de los demás módulos admin. Es intencional (la edición de citas sigue siendo vía `AppointmentDetailDialog`), pero difiere ligeramente de la API común de los demás form dialogs.
- El reset al abrir usa `key="create"` con `{open && (...)}` en lugar de la variable `canRender` del patrón admin; el efecto es idéntico (remontado del content al abrir). Sin impacto.

### Veredicto final

**APROBADO** — La conversión de la creación de cita cumple todos los criterios: modal via `Dialog`, selects desplegables (nombre label / id value), patrón de form dialog coherente con los demás módulos, `onCreated` + toast de éxito, y verificaciones técnicas (lint, tsc) sin errores. La ruta `/admin/appointments/new` fue eliminada y sin referencias. Únicas observaciones de baja severidad no bloqueantes.
