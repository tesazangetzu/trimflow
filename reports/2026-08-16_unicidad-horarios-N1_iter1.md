# Reporte de Ejecución — Unicidad de horarios por día/barbero + eliminación N+1 en admin/schedules (iter 1)

**Fecha:** 2026-08-16
**Agente:** Executor-agent (TRIGGER=ORCHESTRATOR, MODE=AUTO)
**Ámbito:** `schedule.service.ts` · migración `EnforceUniqueSchedulePerBarberDay` · `barbers` (interface/service/controller) · `admin/schedules` (page/service/types/tests)
**Estado:** ✅ COMPLETADO

---

## Plan original (pegado del Planner)

### Objetivo
Garantizar la invariante de negocio **1 registro de horario por día/barbero (máx 7)** con triple refuerzo: (a) validación de unicidad en `ScheduleService.create()` que lanza `BusinessRuleViolation`; (b) índice único parcial en PostgreSQL `UNIQUE(barberId, dayOfWeek) WHERE deletedAt IS NULL`; (c) limpieza de duplicados existentes vía migración (conservando el más reciente por `updatedAt`). Además, eliminar el N+1 del listado de horarios: `GET /barbers?schedule=true` incluye `schedules` ordenados (`dayOfWeek` ASC, `startTime` ASC) y `admin/schedules/page.tsx` pasa a 1 sola llamada. `update()` conserva su semántica. Fuera de alcance: ADR-012 (disponibilidad pública), `AvailabilityBlock`, CRUD barbers, break (ADR-011) y páginas rol barber.

### Referencias en .docs
- `PROJECT.md`: stack confirmado **PostgreSQL**, monolith modular, soft-delete como práctica de dominio.
- `architecture/modules.md`: módulo `schedule/` (Schedule + AvailabilityBlock), módulo `barbers/`, comunicación vía servicios publicados (`IBarberService`, `IScheduleService`), frontend paralelo (`services/`, `types/`).
- `ADR-011-break-horario-barbero.md`: `Schedule.breakStartTime/breakEndTime`; refuerza que `Schedule` es entidad soft-deletable con `deletedAt`.
- `ADR-006-migraciones-de-base-de-datos.md`: **regla de oro** — nunca editar migraciones commiteadas; crear migración nueva; nombre `YYYYMMDDHHMMSS-PascalCase.ts`; revisar la generada.
- `requirements/mvp-scope.md`: "Asignar horarios/bloques de trabajo a barbers" y criterio calidad >80% cobertura, sin doble reserva.
- `database/migrations.md`: flujo `migration:create/run/show`, `synchronize: false`, migraciones corren pre-deploy.

### Pasos

**FASE A — Backend: validación de unicidad en create**
1. Modificar `backend/src/modules/schedule/services/schedule.service.ts` → `create()`: `findOne` previo + `BusinessRuleViolation`.
2. `update()` (líneas 69-82): **sin cambios**.

**FASE B — Backend: migración de dedupe + índice único parcial**
3. Crear migración nueva `EnforceUniqueSchedulePerBarberDay` (NO editar `1785316874524-AddScheduleTables.ts`). Rellenar manualmente: `up()` = soft-delete duplicados + `CREATE UNIQUE INDEX ... WHERE "deletedAt" IS NULL`; `down()` = `DROP INDEX`.

**FASE C — Backend: N+1 en GET /barbers**
4. `IBarberService.findAll(branchId?, includeSchedules?)`.
5. `BarberService.findAll` con `relations` condicional + sort en memoria (`dayOfWeek` ASC, `startTime` ASC).
6. Controller `@Get()`: query param `schedule` (`schedule === 'true'`).

**FASE D — Frontend: 1 sola llamada en admin/schedules**
7. `barbers.service.ts`: `getAll(branchId?, schedule?)` → `params.schedule = true`.
8. `types/barber.ts`: `schedules?: Schedule[]`.
9. `page.tsx`: `loadAll` → `getAll(undefined, true)` + mapeo `?? []`. `handleSubmit`/`handleDeleteSchedule` conservan refresco por barber.

**FASE E — Tests**
10. `schedule.service.spec.ts`: mock `findOne` en create + tests unicidad + update sin chequeo.
11. `barber.service.spec.ts`: `findAll` relations + orden.
12. `page.test.tsx`: mocks con `schedules` + test de regresión N+1.

**FASE F — Verificación**
13. `tsc --noEmit` en backend y frontend (exit 0).
14. `migration:run` + `migration:show` (+ `migration:revert`/`run` local).
15. jest backend (schedule + barbers) y frontend (schedules).

> NOTA: el Orquestador NO ha autorizado commits. No se realizan commits en esta iteración.

---

## Tabla de estado de ejecución

| # | Paso | Estado |
|---|------|--------|
| 1 | `ScheduleService.create()` → chequeo `findOne({ barberId, dayOfWeek })` + `BusinessRuleViolation` | ✅ COMPLETADO |
| 2 | `update()` intacto (sin chequeo de unicidad) | ✅ COMPLETADO (sin cambios, verificado) |
| 3 | Migración `1786860784035-EnforceUniqueSchedulePerBarberDay.ts` (dedupe + índice parcial) | ✅ COMPLETADO |
| 4 | `IBarberService.findAll(branchId?, includeSchedules?)` | ✅ COMPLETADO |
| 5 | `BarberService.findAll` relations condicional + sort en memoria | ✅ COMPLETADO |
| 6 | Controller `@Get()` con query `schedule` | ✅ COMPLETADO |
| 7 | `barbers.service.ts` `getAll(branchId?, schedule?)` | ✅ COMPLETADO |
| 8 | `types/barber.ts` `schedules?: Schedule[]` | ✅ COMPLETADO |
| 9 | `page.tsx` `loadAll` 1 llamada | ✅ COMPLETADO |
| 10 | Tests `schedule.service.spec.ts` (unicidad + update) | ✅ COMPLETADO |
| 11 | Tests `barber.service.spec.ts` (relations + orden) | ✅ COMPLETADO |
| 12 | Tests `page.test.tsx` (mocks + regresión N+1) | ✅ COMPLETADO |
| 13 | `tsc --noEmit` backend + frontend | ✅ COMPLETADO (exit 0 ambos) |
| 14 | `migration:run` + `migration:show` + `revert`/`run` | ✅ COMPLETADO (BD local levantada con docker compose) |
| 15 | jest backend (schedule+barbers) + frontend (schedules) | ✅ COMPLETADO |

## Registro de commits

- Ninguno. Commits no autorizados por el Orquestador.

## Incidentes y desvíos

1. **BD no estaba levantada:** `docker compose up -d postgres` (contenedor `trimflow-postgres`, port 5432) fue necesario para ejecutar la FASE F paso 14. La BD se dejó corriendo (estado `restart: always` definido en `docker-compose.yml`). Nota: existía un contenedor `barber-postgres` del proyecto `barberia` ajeno; no se tocó.
2. **Corrección de test (paso 10):** el test "should not throw when the existing schedule is for a different day" falló en el primer run porque el mock de `findOne` devolvía un objeto fijo (día 2) sin filtrar por el `where` consultado → el chequeo lo trataba como "existe para el día 1" y lanzaba. Se reemplazó por `mockImplementation` que devuelve `null` cuando `where.dayOfWeek === 1` y el día 2 en caso contrario. Test corregido, suite en verde (33/33).
3. **Lint backend: 5 errores PRE-EXISTENTES** (`@typescript-eslint/no-explicit-any`): 1 en `barber.service.spec.ts` L171 (`{ affected: 1, raw: {} } as any`, existía en L138 antes del cambio) y 4 en `schedule.service.ts` (L64 `where: any`, L107 `where: any`, L120-121 `(dto as any)` en `updateBlock`) — todos líneas no tocadas por esta iteración, verificadas vía `git diff` (0 líneas nuevas con `any`). Frontend eslint sobre los 4 archivos tocados: **0 problemas**.
4. **`graphify update .`:** regeneró el grafo (3734 nodes, 6177 edges, 252 communities). `skills-lock.json` produce 0 nodos (warning del propio graphify, no relacionado).
5. **Cambio pre-existente ajeno:** `.opencode/agents/Orchestrator-agent.md` aparece modificado desde antes de iniciar (config del propio Orquestador); no fue tocado por este agente.

## Archivos modificados/creados

| Archivo | Cambio |
|---|---|
| `backend/src/modules/schedule/services/schedule.service.ts` | MODIFICADO — `create()`: chequeo de unicidad `barberId+dayOfWeek` sobre no-borrados → `BusinessRuleViolation` (paso 1) |
| `backend/src/database/migrations/1786860784035-EnforceUniqueSchedulePerBarberDay.ts` | **CREADO** — dedupe soft-delete de duplicados + `CREATE UNIQUE INDEX "UQ_schedules_barberId_dayOfWeek" ON "schedules"("barberId","dayOfWeek") WHERE "deletedAt" IS NULL`; `down()` = `DROP INDEX` (paso 3) |
| `backend/src/modules/barbers/interfaces/barber-service.interface.ts` | MODIFICADO — firma `findAll(branchId?, includeSchedules?)` (paso 4) |
| `backend/src/modules/barbers/services/barber.service.ts` | MODIFICADO — `findAll` con relations condicional + sort en memoria (paso 5) |
| `backend/src/modules/barbers/controllers/barber.controller.ts` | MODIFICADO — query `schedule` (paso 6) |
| `backend/src/modules/schedule/services/schedule.service.spec.ts` | MODIFICADO — `beforeEach` findOne=null en create + 4 tests unicidad + 1 test update sin chequeo (paso 10) |
| `backend/src/modules/barbers/services/barber.service.spec.ts` | MODIFICADO — 3 tests findAll (relations + sort) (paso 11) |
| `frontend/src/services/barbers.service.ts` | MODIFICADO — `getAll(branchId?, schedule?)` (paso 7) |
| `frontend/src/types/barber.ts` | MODIFICADO — `schedules?: Schedule[]` (paso 8) |
| `frontend/src/app/(dashboard)/admin/schedules/page.tsx` | MODIFICADO — `loadAll` 1 sola llamada (paso 9) |
| `frontend/src/app/(dashboard)/admin/schedules/page.test.tsx` | MODIFICADO — mocks con `schedules` + test de regresión N+1 (paso 12) |
| `reports/2026-08-16_unicidad-horarios-N1_iter1.md` | **CREADO** — este reporte |
| `graphify-out/` | regenerado vía `graphify update .` (regla del repo) |

**Intactos (verificados):** `schedule.controller.ts`, `schedule.module.ts`, `schedule.entity.ts`, `create-schedule.dto.ts`, `barbers.module.ts`, `barber.entity.ts` (`OneToMany schedules` pre-existente), `barber-response.dto.ts`, `data-source.ts`, migración `1785316874524-AddScheduleTables.ts`, `barber/schedule/*`, `admin/barbers`, `admin/dashboard`, `appointment-form-dialog`, `barber-form-dialog`.

## Puntos de validación

1. ✅ **App vs índice (consistencia):** el chequeo en `create()` usa `findOne({ where: { barberId, dayOfWeek } })` sin filtrar `isActive`; el `findOne` de TypeORM excluye soft-deleted por defecto → misma semántica que el índice parcial (`WHERE deletedAt IS NULL`). Riesgo 1 cerrado.
2. ✅ **Índice único parcial:** verificado en `pg_indexes` → `CREATE UNIQUE INDEX "UQ_schedules_barberId_dayOfWeek" ON public.schedules USING btree ("barberId", "dayOfWeek") WHERE ("deletedAt" IS NULL)`.
3. ✅ **Dedupe:** SQL de `up()` ejecutado sin errores sobre la BD (tabla sin duplicados previos; comportamiento del `row_number()` verificado por inspección del query log).
4. ✅ **Rechazo de duplicados en BD:** `INSERT` de 2 filas `(barberId, dayOfWeek)` idénticas → `ERROR: duplicate key value violates unique constraint "UQ_schedules_barberId_dayOfWeek"`.
5. ✅ **Soft-delete + re-insert:** tras `UPDATE ... SET deletedAt = now()` para `(barberId, dayOfWeek)` existente, el re-insert del mismo día **sí** procede (el índice parcial lo excluye). Datos de prueba limpiados después.
6. ✅ **`update()` sin chequeo:** test dedicado confirma que `update` no invoca `scheduleRepository.findOne` (la unicidad es regla solo de `create`, alineado a la UI con select de día deshabilitado). Riesgo 2 aceptado y documentado.
7. ✅ **`GET /barbers?schedule=true`:** `relations: ['branch','schedules']` + sort en memoria `dayOfWeek` ASC → `startTime` ASC (test de orden `['s2','s1','s3']`). `GET /barbers` y `GET /barbers/:id` → sin `schedules` (relación no cargada). Riesgo 4 cerrado.
8. ✅ **`admin/schedules` 1 llamada:** test de regresión verifica `barbersService.getAll(undefined, true)` y que `schedulesService.getAll` NO se llama al montar. Refrescos post create/update/delete siguen usando `schedulesService.getAll(barberId)` (fuera de alcance del N+1, mockeado).
9. ✅ **Compatibilidad callers frontend:** `getAll()` sin 2º arg en `admin/dashboard`, `barber/schedule/*`, `appointment-form-dialog` (7 usos) → comportamiento idéntico (sin `params.schedule`).
10. ✅ **Riesgo 3 (findOne + duplicados latentes):** la migración de dedupe corre pre-deploy y elimina duplicados no-borrados antes de que `findActiveSchedule`/`isBarberAvailable` (que usan `findOne`) puedan toparse con `MoreThanOneEntityFoundError`.
11. ✅ **Riesgo 5 (soft-delete no reversible):** `down()` solo hace `DROP INDEX`, no restaura duplicados — acorde a ADR-006 (revert = nueva migración).

## Comandos de verificación ejecutados

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` (backend/) | exit 0 |
| `npx tsc --noEmit` (frontend/) | exit 0 |
| `docker compose up -d postgres` (raíz) | contenedor `trimflow-postgres` iniciado |
| `npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts` | ✅ `Migration EnforceUniqueSchedulePerBarberDay1786860784035 has been executed successfully` |
| `npx typeorm-ts-node-commonjs migration:show -d src/database/data-source.ts` | ✅ 5/5 `[X]` incl. `EnforceUniqueSchedulePerBarberDay1786860784035` |
| `psql ... pg_indexes` | ✅ `UQ_schedules_barberId_dayOfWeek` con `WHERE ("deletedAt" IS NULL)` |
| `npx typeorm-ts-node-commonjs migration:revert` + `migration:run` | ✅ down (DROP INDEX, count=0) y up (index count=1) OK |
| `psql` INSERT duplicado / soft-delete + re-insert | ✅ rechazo unique + re-insert tras soft-delete OK (datos limpiados) |
| `npx jest --config jest.config.ts --testPathPattern "modules/schedule/...|modules/barbers/..."` (backend/) | ✅ 2 suites, 33/33 passed |
| `npx jest --config jest.config.ts` (backend/, suite completa) | ✅ 11 suites, 112/112 passed |
| `npx jest --testPathPatterns "admin/schedules/page.test"` (frontend/) | ✅ 11/11 passed (incl. test de regresión N+1) |
| `npx jest` (frontend/, suite completa) | 1 suite falla: `admin/services/page.test.tsx` (4 tests, `useToastManager must be used within <Toast.Provider>`) — **fallo pre-existente documentado** en iteraciones previas (`2026-08-15_pagina-horarios-cards_iter1.md`, incidente 5), ajeno a esta iteración |
| `npx eslint` sobre archivos tocados (backend/ + frontend/) | 0 problemas nuevos (5 errores pre-existentes `no-explicit-any` en líneas no tocadas) |
| `graphify update .` | ✅ grafo regenerado (3734 nodes, 6177 edges, 252 communities) |

---

## Puntos Auditados

**Agente:** Auditor-agent (TRIGGER=ORCHESTRATOR, MODE=AUTO)
**Fecha:** 2026-08-16
**Fuente de verdad:** `.docs/PROJECT.md`, `.docs/architecture/modules.md`, `.docs/decisions/ADR-006`, `.docs/decisions/ADR-011`, `.docs/requirements/mvp-scope.md`, `.docs/database/migrations.md`
**Evidencia re-verificada por el auditor:** `git diff`, lectura de los 11 archivos modificados + migración, `tsc --noEmit` (backend y frontend), jest (suites tocadas + suites completas), estado real de BD (índice parcial, `typeorm_migrations`, ausencia de duplicados).

### Tabla de criterios auditados

| Nivel | Criterio | Fuente en .docs | Veredicto | Evidencia |
|---|---|---|---|---|
| Backend | **C1** — `ScheduleService.create()` lanza `BusinessRuleViolation` si ya existe horario no-borrado para `(barberId, dayOfWeek)`; chequeo sobre no-borrados **sin filtrar isActive** (consistente con índice) | `requirements/mvp-scope.md` ("Asignar horarios/bloques de trabajo a barbers"); `architecture/modules.md` (módulo `schedule/`) | [✓] | `schedule.service.ts:51-56`: `findOne({ where: { barberId, dayOfWeek } })` sin `isActive`; TypeORM excluye soft-deleted por defecto → misma semántica que `WHERE "deletedAt" IS NULL`. Tests `schedule.service.spec.ts:161-191` (duplicado lanza, mensaje incluye día, día distinto no lanza, soft-deleted=libre). |
| Backend | **C2** — `update()` conserva semántica (sin chequeo de unicidad) | Plan del Planner paso 2 ("update() sin cambios") | [✓] | `git diff`: `update()` (`schedule.service.ts:75-88`) no aparece en los hunks; solo cambió `create()`. Test dedicado `spec:203-209` verifica que `update` no llama a `scheduleRepository.findOne`. |
| Backend/DB | **C3** — Migración **nueva** (no edición de la commiteada): dedupe conservando el más reciente por `updatedAt` + índice único parcial `UNIQUE(barberId, dayOfWeek) WHERE deletedAt IS NULL`; `down()` solo `DROP INDEX` | `ADR-006` ("Nunca editar migración commiteada"; revert = migración nueva); `database/migrations.md` (convención de nombres) | [✓] | `git diff` sobre `migrations/` vacío → `1785316874524-AddScheduleTables.ts` intacta. `1786860784035-EnforceUniqueSchedulePerBarberDay.ts` nueva (untracked): `up()` dedupe con `row_number() OVER (PARTITION BY "barberId","dayOfWeek" ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC)` → soft-delete de `rn>1` + `CREATE UNIQUE INDEX ... WHERE "deletedAt" IS NULL`; `down()` solo `DROP INDEX`. **BD real verificada:** índice `UQ_schedules_barberId_dayOfWeek` con `WHERE ("deletedAt" IS NULL)` presente; `typeorm_migrations` registra la migración; 0 duplicados en `schedules`. |
| Backend/API | **C4** — `GET /barbers?schedule=true` incluye `schedules` ordenados (dayOfWeek ASC, startTime ASC); `GET /barbers` y `GET /barbers/:id` sin `schedules` | `architecture/modules.md` (módulo `barbers/`); plan pasos 4-6 | [✓] | Controller `barber.controller.ts:27-28`: `schedule === 'true'`. `barber.service.ts:28-42`: `relations` condicional (`['branch','schedules']` vs `['branch']`) + sort en memoria `dayOfWeek - dayOfWeek \|\| startTime.localeCompare`. `findOne` carga solo `['branch']` → `GET /barbers/:id` sin schedules. Test `barber.service.spec.ts:107-130` (relations + orden `['s2','s1','s3']`). |
| Frontend | **C5** — `admin/schedules` usa `getAll(undefined, true)` → 1 llamada; demás callers de `getAll` sin 2º arg intactos | `architecture/modules.md` (frontend `services/`, `types/`); plan pasos 7-9 | [✓] | `page.tsx:93` `getAll(undefined, true)`; mapeo `b.schedules ?? []` (`page.tsx:94`). `barbers.service.ts:4-7` params condicionales. Callers sin 2º arg intactos: `appointment-form-dialog:61`, `barber/schedule:52`, `barber/schedule/blocks:65`, `admin/barbers:46`, `admin/dashboard:56`. Test regresión N+1 `page.test.tsx:222-229` (`getAll(undefined, true)` y `schedulesService.getAll` NO llamado al montar). |
| Calidad | **C6** — Tests actualizados y en verde; `tsc --noEmit` exit 0 backend+frontend | `mvp-scope.md` (criterio calidad >80% cobertura); plan FASE F | [✓] | **Re-ejecutado por el auditor:** `tsc --noEmit` backend exit 0; frontend exit 0. Jest backend (schedule+barbers) **33/33**; suite completa backend **11 suites / 112 tests**; frontend `admin/schedules/page.test` **11/11**. Falla única en suite frontend completa = `admin/services` (Toast.Provider, **pre-existente**). |
| Alcance | **C7** — No se tocaron archivos fuera de alcance (páginas rol barber, blocks, disponibilidad pública, CRUD barbers, ADR-011) | Plan del Planner "Fuera de alcance" | [✓] | `git status`/`git diff --stat`: solo 11 archivos en alcance + migración + reporte. `schedule.entity.ts` (break ADR-011) intacto; `barber/schedule/*`, `admin/barbers`, blocks, módulo `public/` intactos. Única modificación ajena: `.opencode/agents/Orchestrator-agent.md` (config pre-existente del propio Orquestador, verificada en diff: política de commit automático, sin relación con la iteración). |

### Detalle de fallas

No se detectaron fallas atribuibles a esta iteración. Ninguna afirmación del reporte del Executor fue desmentida por la evidencia re-verificada. Verificaciones del Executor confirmadas por el auditor: índice único parcial presente en BD, migración aplicada y registrada, `tsc` exit 0 en ambos proyectos, suites tocadas en verde (33/33 y 11/11), N+1 eliminado (test de regresión).

### Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Criterios auditados | 7 |
| Aprobados [✓] | 7 |
| Observaciones [!] | 0 |
| Fallidos [✗] | 0 |
| **Veredicto global** | **APROBADO** |

### Acción requerida

Ninguna. El resultado es consistente con el Mapa de Intención y con la fuente de verdad en `.docs`. No se requieren correcciones antes de avanzar al siguiente nivel (N2). Recordatorio operativo: se han validado las afirmaciones del reporte con evidencia real; los cambios quedan pendientes de commit/push por decisión del Orquestador (no autorizado en esta iteración).

### Deuda técnica registrada

1. **Lint backend (5 errores pre-existentes `@typescript-eslint/no-explicit-any`)**: `barber.service.spec.ts:171` (`{ affected: 1, raw: {} } as any`) y `schedule.service.ts:64,107,120-121` (`where: any`, `(dto as any)`). **No introducidos por esta iteración** (verificado vía `git diff`: 0 líneas nuevas con `any`). Severidad BAJA.
2. **Suite frontend `admin/services/page.test.tsx` rota (4 tests, `useToastManager must be used within <Toast.Provider>`)**: fallo pre-existente documentado en iteraciones previas, ajeno a esta iteración (`admin/services` no tocado). Severidad BAJA.
3. **TOCTOU en `create()` (check-then-insert)**: el chequeo de unicidad en app no es concurrent-safe; la garantía real es el índice único de BD. Riesgo ya cerrado por diseño (triple refuerzo del plan). Severidad BAJA.
4. **`update()` puede romper unicidad solo vía API directa**: `UpdateScheduleDto` admite `dayOfWeek`; un cambio de día por API caería en la constraint única → error 500 crudo. Mitigado en UI (select de día deshabilitado en edición, `page.tsx:497`) y aceptado explícitamente como "Riesgo 2" en el reporte. Severidad BAJA.
