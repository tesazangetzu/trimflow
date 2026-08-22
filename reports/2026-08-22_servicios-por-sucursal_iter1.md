# Reporte de ejecución — Gestión de servicios filtrada por sucursal (`/admin/services`)

**Fecha:** 2026-08-22 · **Iteración:** 1 · **Modo:** orquestador automático
**Fuente de verdad:** `.docs/PROJECT.md`, `.docs/architecture/modules.md`, `.docs/requirements/mvp-scope.md` (ítem pendiente "Servicios por sucursal")

## Estado final

✅ **Completado sin bloqueantes.** Tests 59/59 verdes, build OK, lint sin regresiones (baseline preexistente intacto), `git diff` no toca `backend/`.

## Pasos ejecutados

### Paso 1 — `BranchFilterSelect` ✅

Archivo nuevo: `frontend/src/components/branches/branch-filter-select.tsx`

- Componente puro y testeable: recibe `branches: Branch[]` ya cargadas por la página; sin fetch interno.
- Props: `branches`, `value: string | null`, `onChange(branchId | null)`, `disabled?`.
- `Select` shadcn (`ui/select.tsx`) con opción sentinela `"all"` → emite `null`.
- Placeholder/default: "Todas las sucursales"; items ordenados por `name`, value = `id`.
- Se pasa `items` al root del Select (Base UI) para que el trigger resuelva labels correctamente.
- R1/R2: si `branches.length === 0` (o `disabled`), el selector queda deshabilitado y la página funciona como hoy.

### Paso 2 — Página `/admin/services` ✅

Archivo: `frontend/src/app/(dashboard)/admin/services/page.tsx`

- Nuevo estado `selectedBranchId: string | null` (default `null`) + estado `branches`.
- Carga silenciosa de sucursales al montar (`branchesService.getAll()`); si falla, la página sigue operativa sin filtro (captura con `.catch(() => {})`).
- Efecto de servicios dependiente de `selectedBranchId`: `servicesService.getAll(selectedBranchId ?? undefined)`. `undefined` → request **sin query param** (verificado en tests).
- Race conditions (R4): patrón ignore-stale vía flag `active` del cleanup del efecto — respuestas de requests obsoletos se descartan antes de `setServices`.
- `<BranchFilterSelect>` renderizado sobre la lista.
- "Nuevo Servicio" pasa `defaultBranchId={selectedBranchId ?? undefined}` a `ServiceFormDialog`.
- Tras crear: refetch con el filtro vigente (`refetchWithFilter`) en vez de insertar localmente (R3).
- Eliminar sigue removiendo localmente → cumple AC 7 también con filtro activo.

**Desviación técnica justificada:** el plan pedía "resetear `loading=true`" dentro del efecto, pero la regla `react-hooks/set-state-in-effect` del linter lo rechaza. Se resolvió derivando `loading` desde un estado `loadedFilter` comparado contra `selectedBranchId`: mismo comportamiento observable (skeleton al montar y en cada cambio de filtro), sin setState síncrono en el cuerpo del efecto.

### Paso 3 — `ServiceFormDialog` ✅

Archivo: `frontend/src/components/services/service-form-dialog.tsx`

- Nueva prop opcional `defaultBranchId?: string`, propagada a `ServiceFormContent`.
- En create, `branchId` se inicializa con `entity?.branchId ?? defaultBranchId ?? ""`.
- Select de sucursal visible **solo en create**, opciones vía `branchesService.getAll()` (carga silenciosa).
- Validación inline: si `branchId` queda vacío al enviar en create → error "Seleccioná una sucursal", no se llama a `create` ni se envía `""`.
- En edit no se renderiza el select y el dto de update nunca incluye `branchId`.

### Paso 4 — Sin tocar ✅

Backend, `service-offering.service.ts` (frontend, ya aceptaba `branchId?`) y tipos: sin cambios.

## Hallazgo del Planner — verificado

**Confirmado:** el form enviaba `branchId: ""` hardcodeado al crear (`service-form-dialog.tsx:66` previo al cambio).

**El backend NO acepta `""`**: `backend/src/modules/services/dto/create-service.dto.ts` declara `@IsUUID() branchId` → `POST /services` respondía 400 siempre que se creaba desde "Nuevo Servicio". Es decir, el flujo de creación estaba **roto de punta a punta** (bug activo, no latente). Corregido íntegramente en frontend según plan; backend no requiere cambios ni se modificó.

## Tests

| Suite | Resultado |
|---|---|
| `src/components/branches/branch-filter-select.test.tsx` (nuevo) | 2/2 ✅ |
| `src/app/(dashboard)/admin/services/page.test.tsx` (actualizado) | 9/9 ✅ |
| `src/components/services/service-form-dialog.test.tsx` (actualizado) | 7/7 ✅ |
| **Suite completa frontend** | **59/59 ✅ (10 suites)** |

Cobertura de los casos pedidos:
- Página: selector default "Todas" + `getAll(undefined)`; selección → `getAll("br1")`; volver a "Todas" → request sin query param; `defaultBranchId="br1"` propagado al dialog mockeado; sin filtro → sin `defaultBranchId`.
- Dialog: create con `defaultBranchId` envía ese `branchId`; sin selección → error inline y `create` NO llamado; cambio de sucursal dentro del form; edit sin select y `update` sin `branchId`.
- Selector: renderiza "Todas" + sucursales; `onChange(null)` al elegir "Todas" y `onChange("br1")` al elegir sucursal.

**Nota:** `page.test.tsx` ya fallaba en HEAD (4/4 tests) por falta de mock de `useToastManager` tras el rediseño Base UI del wizard (commit `38c14c4`). Se agregó el mock estándar usado por otros suites — bug de test preexistente, corregido de paso.

## Verificación de criterios de aceptación

| # | Criterio | Estado |
|---|---|---|
| 1 | Selector default "Todas las sucursales", lista completa | ✅ test |
| 2 | Filtro por sucursal → `GET /services?branchId=<id>` | ✅ test (`getAll("br1")`) |
| 3 | Volver a "Todas" → request sin query param | ✅ test |
| 4 | "Nuevo Servicio" con sucursal pre-seleccionada; crea en ella y refetch muestra | ✅ test + refetch implementado |
| 5 | Sin filtro: validación inline "Seleccioná una sucursal"; nunca `branchId: ""` | ✅ test |
| 6 | Editar no altera sucursal (`update` sin `branchId`) | ✅ test |
| 7 | Eliminar con filtro activo lo quita de la vista (remoción local) | ✅ código existente compatible |
| 8 | `npm test` verde; build/lint sin errores nuevos | ✅ 59/59, build OK, lint = baseline |
| 9 | `git diff` sin cambios en `backend/` | ✅ verificado |

## Lint

`npm run lint`: 4 errores + 6 warnings — **idéntico al baseline de HEAD** (archivos ajenos: `BookingWizard.tsx`, `use-availability.ts`, `use-public-data.ts`, `use-tenant-name.ts`, `<img>` warnings). Cero issues en los archivos modificados/creados. `npx tsc --noEmit` limpio.

## Riesgos mitigados

- **R1** Sin sucursales → selector deshabilitado, página operativa.
- **R2** Fallo cargando branches → catch silencioso en página y dialog.
- **R3** Crear fuera del filtro → refetch con filtro vigente tras crear.
- **R4** Cambios rápidos de filtro → flag `active` por efecto descarta respuestas obsoletas.

## Commits

Ninguno (indicado por el Orquestador). Archivos listos para auditoría:

```
modified:   frontend/src/app/(dashboard)/admin/services/page.tsx
modified:   frontend/src/app/(dashboard)/admin/services/page.test.tsx
modified:   frontend/src/components/services/service-form-dialog.tsx
modified:   frontend/src/components/services/service-form-dialog.test.tsx
new file:   frontend/src/components/branches/branch-filter-select.tsx
new file:   frontend/src/components/branches/branch-filter-select.test.tsx
```

---

## Auditoría — Iteración 1

**Auditor:** Auditor-agent · **Fecha:** 2026-08-22 · **Fuente de verdad:** `.docs`
**Método:** lectura directa de los 3 archivos modificados/nuevos + sus tests, verificación de `git diff`, ejecución propia de `npm test` y `tsc --noEmit`, contraste contra `.docs/requirements/mvp-scope.md` (Backlog > "Gestión por sucursal"), `.docs/architecture/modules.md` y ADRs de UI (ADR-007, ADR-008).

### 1. Tabla de criterios de aceptación

| # | Criterio | Estado | Evidencia |
|---|----------|--------|-----------|
| 1 | Selector default "Todas las sucursales", lista completa | ✅ | `branch-filter-select.tsx:12,28,35` (sentinela `"all"` → `null`); `page.test.tsx:78-88` |
| 2 | Filtro por sucursal → `GET /services?branchId=<id>` | ✅ | `page.tsx:68-85` (`getAll(selectedBranchId ?? undefined)`); `service-offering.service.ts:4-8`; test `page.test.tsx:90-101` |
| 3 | Volver a "Todas" → request **sin** query param | ✅ | `service-offering.service.ts:5` (`params = {}` si falsy); test `page.test.tsx:103-121` (`toHaveBeenLastCalledWith(undefined)`) |
| 4 | Crear con sucursal pre-seleccionada + refetch con filtro vigente | ✅ | `page.tsx:240,241,87-89`; dialog inicializa `branchId` con `defaultBranchId` (`service-form-dialog.tsx:60-62`) y envía `branchId` en create (`:102`); test `service-form-dialog.test.tsx:56-94` |
| 5 | Sin filtro: validación inline; nunca `branchId: ""` | ✅ | `service-form-dialog.tsx:88-91` (return antes de llamar a `create`); test `service-form-dialog.test.tsx:96-108` |
| 6 | Editar no altera sucursal (update sin `branchId`) | ✅ | `service-form-dialog.tsx:95-110` (dto sin branchId en edit); select solo en create (`:135`); test `service-form-dialog.test.tsx:141-185` (`not.toHaveProperty("branchId")`) |
| 7 | Eliminar con filtro activo lo quita de la vista | ✅ | `page.tsx:96` (remoción local por `id`, compatible con filtro) |
| 8 | Tests/build/lint verdes | ✅ | Ejecutado por auditor: `npm test` → **10 suites / 59 passed**; `npx tsc --noEmit` limpio |
| 9 | `git diff` sin cambios en `backend/` | ✅ | `git diff --stat -- backend/` → 0 líneas |

### 2. Conformidad con .docs

| Fuente | Resultado |
|--------|-----------|
| `mvp-scope.md` Backlog "Gestión por sucursal" | Implementa exactamente el ítem "Servicios por sucursal" (UX sobre `Service.branchId` existente); horarios/clientes/barberos quedan intocados, como declara el alcance. El ítem del backlog sigue marcado `[ ]` — correcto: actualizar `.docs` no estaba en alcance de esta iteración (pendiente post-aprobación). |
| `modules.md` (frontend paralelo estructural) | Componente nuevo ubicado en `components/branches/`, servicio consumido vía capa `services/` — estructura conforme. Sin cambios de contratos API. |
| ADR-008 (formularios cortos en modales) | Cumple: crear/editar sigue siendo modal reutilizable con `mode: "create" \| "edit"` junto a la tabla; se añadió un campo al form corto (≤6 campos), dentro del rango del ADR. |
| ADR-007 (rediseño dashboards) | Cumple: usa componentes shadcn/ui propios (`ui/select.tsx`), tokens estándar, sin páginas nuevas ni cambios de API. |

### 3. Hallazgos

| ID | Severidad | Hallazgo |
|----|-----------|----------|
| H-1 | BAJA | `refetchWithFilter` (`page.tsx:87-89`) usa `.then(setServices)` sin `.catch`: si el refetch post-creación falla, hay rechazo de promesa no manejado y la lista queda desactualizada sin feedback. No bloquea (el toast de éxito ya se emitió y el efecto re-sincroniza ante cualquier cambio de filtro). |
| H-2 | BAJA | El camino "crear → refetch muestra el servicio" no tiene cobertura automatizada end-to-end: `page.test.tsx` mockea `ServiceFormDialog` (no dispara `onCreated`) y `service-form-dialog.test.tsx` mockea la página. La lógica existe y es trivialmente correcta por inspección, pero el criterio 4 se valida solo parcialmente por test. |
| H-3 | BAJA | Si `branchesService.getAll()` falla dentro del dialog (catch silencioso, `service-form-dialog.tsx:78`), el select queda vacío y el único feedback al usuario es el error genérico "Seleccioná una sucursal", sin indicar el problema real de carga. Degradación aceptable según R2, pero mejorable. |
| H-4 | BAJA | El árbol de trabajo contiene un cambio **preexistente y ajeno a esta iteración** en `.docs/requirements/mvp-scope.md` (marcado de la feature de upload R2 del 2026-08-21, commit `407821a`). No fue producido por este Executor (no figura en su lista de archivos) ni afecta esta auditoría; se registra para higiene del repo antes de commitear. |

No se detectaron hallazgos de severidad MEDIA, ALTA o CRÍTICA.

### 4. Evaluación de hallazgos y desviaciones declaradas por el Executor

- **Hallazgo del Executor (creación rota preexistente):** VERIFICADO e independiente. `backend/src/modules/services/dto/create-service.dto.ts:27-28` declara `@IsUUID() branchId` (obligatorio), y el form anterior enviaba `branchId: ""` hardcodeado → `POST /services` respondía siempre 400. La corrección frontend (validación inline que impide enviar `""` + select obligatorio en create) es **correcta y suficiente dentro del alcance "sin cambios en backend"**: restaura el flujo de creación sin tocar DTO ni modelo. Residual: la validación vive solo en cliente; el backend ya la garantizaba con `@IsUUID`, así que no hay brecha de integridad.
- **Desviación declarada (derivar `loading` en vez de setState en efecto):** ACEPTABLE. `page.tsx:62-66` deriva `loading = loadedFilter === undefined || loadedFilter !== selectedBranchId`. Es equivalente observable al plan original (skeleton al montar y en cada cambio de filtro, incluida la ruta de error `:77-81` que también marca `loadedFilter`), cumple la regla `react-hooks/set-state-in-effect`, y elimina una fuente clásica de doble render. Correcta y bien documentada.
- **Nota sobre tests de página:** el arreglo del mock de `useToastManager` (bug preexistente en HEAD tras commit `38c14c4`) es legítimo y mínimo; verificado que los 9 tests de página pasan.

### 5. VEREDICTO

⚠️ **APROBADO CON OBSERVACIONES**

Severidades involucradas: 0 CRÍTICA · 0 ALTA · 0 MEDIA · 4 BAJA (H-1…H-4).

La implementación cumple los 9 criterios de aceptación, es conforme con `mvp-scope.md`, `modules.md`, ADR-007 y ADR-008, no toca `backend/`, y la suite completa (59/59) más `tsc --noEmit` fueron reproducidos por el auditor con resultado verde. Los hallazgos son todos de severidad BAJA (manejo de error del refetch, hueco menor de cobertura de test, UX degradada ante fallo de carga de branches, y un cambio ajeno preexistente en `.docs`); ninguno bloquea. Se recomienda atender H-1/H-2 en una próxima iteración y resolver el estado dirty de `.docs` (H-4) antes del commit.
