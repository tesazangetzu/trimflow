# Reporte Técnico Final
## Unicidad de horarios por día/barbero + eliminación N+1 en el listado de horarios

> **Generado:** 2026-08-16
> **Proyecto:** TrimFlow
> **Stack:** NestJS 10 · TypeORM 0.3 · PostgreSQL (backend) / Next.js 16 · React 19 · TypeScript · shadcn/ui (frontend)
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO

---

## Objetivo confirmado

Garantizar 1 registro de horario por día/barbero (máx 7) con validación de unicidad en backend, limpieza de duplicados existentes + índice único parcial en BD; y eliminar el N+1 del listado de horarios incluyendo la relación `schedules` en `GET /barbers` solo cuando se pida con `?schedule=true`.

**Éxito cuando:**
- `ScheduleService.create()` lanza `BusinessRuleViolation` si el barbero ya tiene un horario no-borrado para ese `dayOfWeek`.
- `update()` conserva su semántica (actualiza el registro existente).
- Migración nueva limpia duplicados (conserva el más reciente por día) y crea índice único parcial `UNIQUE(barberId, dayOfWeek) WHERE deletedAt IS NULL`.
- `GET /barbers?schedule=true` incluye `schedules` ordenados; `GET /barbers` sin param NO incluye `schedules`.
- `admin/schedules` deja de hacer N llamadas: usa `barbersService.getAll(undefined, true)` → 1 llamada.
- Tests backend y frontend actualizados y en verde; `tsc --noEmit` exit 0.

**Fuera de alcance:**
- Cálculo de disponibilidad pública (ADR-012), `AvailabilityBlock`, CRUD de barbers, break (ADR-011).
- Páginas rol barber (`barber/schedule`, `barber/schedule/blocks` — no son N+1, quedan intactas).

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO             | —                                |

---

## Decisiones técnicas tomadas

### Semántica de unicidad en `ScheduleService.create()`

**Qué se decidió:**
El `create()` valida antes de guardar con `findOne({ where: { barberId, dayOfWeek } })` y lanza `BusinessRuleViolation` (`Barber {barberId} already has a schedule for day {dayOfWeek}`) si ya existe un horario no-borrado para ese día. `update()` no añade chequeo de unicidad.

**Por qué se tomó esta decisión:**
Decisión explícita del programador (#1): al crear se verifica si el día ya está registrado y se dispara error; al actualizar se actualiza normal. El `findOne` de TypeORM excluye soft-deleted por defecto, alineándose con la semántica del índice parcial (`WHERE deletedAt IS NULL`).

**Alternativas descartadas:**
- Upsert en `create()` (reemplazar el existente): descartada por decisión del programador — la semántica pedida es error al crear un día ya existente.
- Validar solo `isActive: true`: permitiría crear un 2º registro inactivo que el índice rechazaría → 500 en vez de 422. Se valida sobre cualquier registro no-borrado, consistente con el índice.

**Impacto en .docs:**
La invariante "1 registro de horario por día" no estaba documentada explícitamente en `.docs`; queda como mejora sugerida documentarla (ver "Lo que el programador debe saber").

**Impacto en el código:**
`backend/src/modules/schedule/services/schedule.service.ts` — `create()` con chequeo de unicidad; el resto del servicio intacto.

### Migración de dedupe + índice único parcial

**Qué se decidió:**
Nueva migración `1786860784035-EnforceUniqueSchedulePerBarberDay.ts` que (1) soft-deletea duplicados conservando el más reciente por `updatedAt` (window `row_number() OVER (PARTITION BY barberId, dayOfWeek ORDER BY updatedAt DESC, createdAt DESC, id DESC)`), y (2) crea `CREATE UNIQUE INDEX "UQ_schedules_barberId_dayOfWeek" ON "schedules"("barberId","dayOfWeek") WHERE "deletedAt" IS NULL`. `down()` solo `DROP INDEX`.

**Por qué se tomó esta decisión:**
ADR-006 prohíbe editar migraciones commiteadas → se crea migración nueva. Como la tabla usa soft-delete (`deletedAt`), un `UNIQUE` normal rompería al re-crear un horario tras borrarlo; el índice parcial `WHERE deletedAt IS NULL` permite el re-insert tras soft-delete (verificado en BD real). Decisión del programador (#2): limpieza automática de los 9 duplicados existentes.

**Alternativas descartadas:**
- UNIQUE normal `(barberId, dayOfWeek)`: inviable con soft-delete.
- Limpieza manual (opción B): descartada por el programador — se prefiere la migración automática.

**Impacto en .docs:**
Ninguna alteración; sigue el flujo de `database/migrations.md` y ADR-006.

**Impacto en el código:**
Archivo nuevo de migración. La entidad `schedule.entity.ts` no cambia (el índice se gestiona solo por migración).

### `GET /barbers?schedule=true` con relación `schedules`

**Qué se decidió:**
`BarberService.findAll(branchId?, includeSchedules = false)` carga `relations: ['branch']` por defecto y `['branch','schedules']` solo si `includeSchedules`. Los `schedules` se ordenan en memoria por `dayOfWeek` ASC, `startTime` ASC (TypeORM no ordena relaciones en `find`; máx 7 por barbero). El controller expone el query param `schedule` (`schedule === 'true'`). Sin el param, la respuesta es idéntica a antes (la relación no se carga y se omite en JSON).

**Por qué se tomó esta decisión:**
Decisión del programador: el horario debe venir en el listado para no hacer llamadas por cada barbero, pero sin ensuciar otras respuestas → parámetro opt-in. El frontend `admin/schedules` pasa de N+1 a 1 sola llamada.

**Alternativas descartadas:**
- Cargar siempre la relación en `GET /barbers`: ensuciaría otras respuestas (rechazado por el programador).
- QueryBuilder para ordenar la relación en SQL: sobre-ingeniería para ≤7 registros por barbero.

**Impacto en .docs:**
Ninguna alteración; refuerza `modules.md` (comunicación vía servicios publicados).

**Impacto en el código:**
`barber-service.interface.ts`, `barber.service.ts`, `barber.controller.ts` (backend) y `barbers.service.ts`, `types/barber.ts`, `admin/schedules/page.tsx` (frontend).

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `backend/src/database/migrations/1786860784035-EnforceUniqueSchedulePerBarberDay.ts` | Dedupe de duplicados (conserva más reciente) + índice único parcial `WHERE deletedAt IS NULL` | ADR-006 + decisión #2 del programador |
| `reports/2026-08-16_unicidad-horarios-N1_iter1.md` | Reporte de ejecución + auditoría de la iteración | — |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `backend/src/modules/schedule/services/schedule.service.ts` | `create()` con chequeo de unicidad `findOne({barberId, dayOfWeek})` → `BusinessRuleViolation` | Decisión #1: error al crear un día ya registrado |
| `backend/src/modules/schedule/services/schedule.service.spec.ts` | Mock `findOne` en create + 4 tests de unicidad + 1 test update sin chequeo | Cubrir la nueva regla |
| `backend/src/modules/barbers/interfaces/barber-service.interface.ts` | Firma `findAll(branchId?, includeSchedules?)` | N+1 → relación opt-in |
| `backend/src/modules/barbers/services/barber.service.ts` | `findAll` con relations condicional + sort en memoria | N+1 → relación opt-in |
| `backend/src/modules/barbers/controllers/barber.controller.ts` | Query param `schedule` en `@Get()` | N+1 → relación opt-in |
| `backend/src/modules/barbers/services/barber.service.spec.ts` | 3 tests de `findAll` (relations + orden) | Cubrir la nueva firma |
| `frontend/src/services/barbers.service.ts` | `getAll(branchId?, schedule?)` → `params.schedule = true` | N+1 → 1 llamada |
| `frontend/src/types/barber.ts` | `schedules?: Schedule[]` | Tipar la relación incluida |
| `frontend/src/app/(dashboard)/admin/schedules/page.tsx` | `loadAll` usa `getAll(undefined, true)` + mapeo `?? []` | Eliminar el N+1 |
| `frontend/src/app/(dashboard)/admin/schedules/page.test.tsx` | Mocks con `schedules` + test de regresión de 1 llamada | Verificar fin del N+1 |

### Archivos eliminados

| Archivo | Motivo de eliminación |
|---------|----------------------|
| (ninguno) | — |

---

## Cambios en archivos clave

### `backend/src/modules/schedule/services/schedule.service.ts`

**Antes:** `create()` validaba solo el break y guardaba directo — permitía crear N horarios para el mismo `(barberId, dayOfWeek)`.
**Después:** `create()` ejecuta `findOne({ where: { barberId, dayOfWeek } })` (excluye soft-deleted) y lanza `BusinessRuleViolation` si existe; luego crea. `update()` intacto.
**Por qué es importante:** es la puerta de entrada del horario del barbero; el bug reportado (9 registros en vez de 7) nace aquí al no existir validación ni constraint de unicidad.

### `backend/src/database/migrations/1786860784035-EnforceUniqueSchedulePerBarberDay.ts`

**Antes:** no existía.
**Después:** dedupe (soft-delete de duplicados conservando el más reciente) + índice único parcial. Es la garantía de BD que respalda la validación de aplicación (y mitiga TOCTOU).
**Por qué es importante:** sin este índice, dos peticiones concurrentes podrían crear el mismo día; además limpia los 9 duplicados que el usuario ya tenía.

### `frontend/src/app/(dashboard)/admin/schedules/page.tsx`

**Antes:** `loadAll` hacía `getAll()` + `Promise.all(allBarbers.map(b => schedulesService.getAll(b.id)))` → 1 llamada por barbero (N+1).
**Después:** `loadAll` hace 1 sola llamada `getAll(undefined, true)` y mapea `{ ...b, schedules: b.schedules ?? [] }`. El refresco tras crear/editar/borrar sigue usando `schedulesService.getAll(editBarber.id)` (1 barbero, no N+1).
**Por qué es importante:** es la página de gestión de horarios del administrador; el N+1 escalaba con el número de barbers.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| `create()` lanza `BusinessRuleViolation` si ya existe horario para el día | Cumplido | Auditoría C1: código + tests (4) en `schedule.service.spec.ts` |
| `update()` conserva semántica sin chequeo de unicidad | Cumplido | Auditoría C2: test dedicado; `update()` no invoca `findOne` de unicidad |
| Migración nueva con dedupe + índice único parcial `WHERE deletedAt IS NULL` | Cumplido | Auditoría C3: `pg_indexes` confirma índice; `migration:show` 5/5; INSERT duplicado rechazado; re-insert tras soft-delete OK |
| `GET /barbers?schedule=true` incluye schedules ordenados | Cumplido | Auditoría C4: `relations: ['branch','schedules']` + test de orden `['s2','s1','s3']` |
| `GET /barbers` sin param NO incluye schedules | Cumplido | Auditoría C4: relación no cargada por defecto; `findOne`/`findByBranch` intactos |
| `admin/schedules` usa 1 llamada (fin N+1) | Cumplido | Auditoría C5: test de regresión verifica `getAll(undefined, true)` y que `schedulesService.getAll` NO se llama al montar; 7 callers restantes de `getAll` intactos |
| Tests en verde + `tsc --noEmit` exit 0 | Cumplido | Auditoría re-ejecutó: backend 112/112, frontend `schedules` 11/11, tsc exit 0 backend+frontend |
| Fuera de alcance intacto | Cumplido | Auditoría C7: páginas rol barber, blocks, ADR-011 sin cambios |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | 5 errores lint `no-explicit-any` pre-existentes en líneas no tocadas | BAJA | `schedule.service.ts` L64/107/120-121, `barber.service.spec.ts` L171 | Limpiar en iteración de lint |
| 2 | Suite `admin/services/page.test.tsx` rota por `Toast.Provider` (pre-existente, documentada en iteraciones previas) | MEDIA | `admin/services/page.test.tsx` | Pendiente |
| 3 | TOCTOU en `create()` (check-app antes de insert) mitigado por el índice único de BD | BAJA | `schedule.service.ts` | No urgente (índice protege) |
| 4 | `update()` acepta `dayOfWeek` en DTO; cambiar de día vía API directa a un día ya ocupado rompería unicidad (500) — mitigado en UI (select deshabilitado) | BAJA | `update-schedule.dto.ts` (no tocado) | Riesgo aceptado |

---

## Lo que el programador debe saber

- **El bug de los 9 registros queda resuelto en tres capas**: validación en `create()` (error si el día ya existe), índice único parcial en BD (garantía incluso ante concurrencia) y migración que limpia los duplicados existentes (conserva el más reciente por `updatedAt`).
- **El N+1 del listado de horarios desapareció**: `admin/schedules` hace ahora 1 sola llamada a `GET /barbers?schedule=true`. El resto de respuestas de `GET /barbers` no cambian (sin `schedule` param).
- **Convención nueva**: para traer los horarios junto a los barbers se usa `?schedule=true` (opt-in). Si otro listado necesita los horarios, se usa el mismo parámetro en vez de llamar a `/schedules?barberId=` por cada barbero.
- **Migración pendiente de correr en producción**: `npm run migration:run` (pre-deploy). Es destructiva solo sobre duplicados (los conservados no se tocan).
- **Invariante no documentada**: "1 horario por día/barbero" no está explícita en `.docs`. Sugerencia: que el Architect la registre (p.ej. actualizar `mvp-scope.md` o un ADR breve) para que futuras iteraciones la respeten.
- **Los fallos de lint/test globales NO son de esta iteración** (pre-existentes documentados).
- **`graphify update .` ejecutado**: grafo regenerado (3734 nodes, 6177 edges).

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-16_unicidad-horarios-N1_iter1.md` |
