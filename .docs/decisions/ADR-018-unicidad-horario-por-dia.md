# ADR-018: Unicidad de horarios por día/barbero (máx 7 registros)

**Estado:** ACEPTADO
**Fecha:** 2026-08-16

**Contexto:**
Un usuario reportó que un barbero tenía **9 registros de horario** para los 7 días de la semana: el modelo de datos permitía crear N horarios para el mismo `(barberId, dayOfWeek)` sin ninguna restricción. No existía validación en la aplicación ni constraint de unicidad en la base de datos. La puerta de entrada es `ScheduleService.create()` (backend/src/modules/schedule/services/schedule.service.ts), que validaba únicamente el break y guardaba directo.

La tabla `schedules` usa **soft-delete** (`@DeleteDateColumn()`, columna `deletedAt`), por lo que un `UNIQUE` normal sobre `(barberId, dayOfWeek)` impediría re-crear un día tras borrarlo (el registro soft-deleted seguiría ocupando la clave). Además, al existir datos duplicados en producción, crear el índice fallaría sin una limpieza previa.

La invariante de negocio es: **1 registro de horario por día de la semana y por barbero (máx 7)**. Esta invariante no estaba documentada en `.docs`.

## Decisión

Aplicar la unicidad en **dos capas** (aplicación + base de datos) y conservar la semántica de `update()`:

1. **Validación en `ScheduleService.create()`**: antes de guardar, se ejecuta `findOne({ where: { barberId, dayOfWeek } })`. Si existe un registro **no-borrado** para ese día, se lanza `BusinessRuleViolation` con el mensaje `Barber {barberId} already has a schedule for day {dayOfWeek}`. El `findOne` de TypeORM excluye soft-deleted por defecto, alineándose con la semántica del índice parcial.
2. **`update()` sin chequeo de unicidad**: actualiza el registro existente (recibe el `id`) sin re-validar unicidad. Cambiar de `dayOfWeek` vía API a un día ya ocupado quedaría protegido solo por el índice (500) — mitigado en la UI (select deshabilitado) y aceptado como riesgo.
3. **Migración nueva** (`1786860784035-EnforceUniqueSchedulePerBarberDay.ts`): (a) soft-deletea los duplicados existentes conservando el más reciente por `updatedAt` (window `row_number() OVER (PARTITION BY barberId, dayOfWeek ORDER BY updatedAt DESC, createdAt DESC, id DESC)`); (b) crea el índice único parcial:
   ```sql
   CREATE UNIQUE INDEX "UQ_schedules_barberId_dayOfWeek" ON "schedules" ("barberId", "dayOfWeek") WHERE "deletedAt" IS NULL;
   ```
   El `WHERE deletedAt IS NULL` permite re-crear un día tras soft-delete. `down()` solo ejecuta `DROP INDEX`.

Nota: el índice **NO considera `isActive`**: la unicidad es sobre cualquier registro no-borrado, consistente con el chequeo de la aplicación.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|----------------------|
| **UNIQUE normal `(barberId, dayOfWeek)`** | Inviable con soft-delete: un registro soft-deleted seguiría ocupando la clave e impediría re-crear el día. |
| **Upsert en `create()`** (reemplazar el existente) | Descartada por decisión del programador: la semántica pedida es **error** al crear un día ya registrado, no silenciar el reemplazo. |
| **Validar solo `isActive: true`** | Permitiría crear un 2º registro inactivo que el índice rechazaría → 500 en vez de error de regla de negocio. La validación sobre cualquier registro no-borrado es consistente con el índice. |
| **Limpieza manual de duplicados** | Descartada por el programador: se prefiere la migración automática (dedupe + índice en un solo paso). |

## Consecuencias

### Positivas
- **Invariante garantizada en dos capas**: validación de aplicación (error claro 422/regla de negocio) + índice único parcial de BD (garantía incluso ante concurrencia / TOCTOU).
- **Compatibilidad con soft-delete**: el `WHERE deletedAt IS NULL` permite borrar un día y re-crearlo en el futuro.
- **Corrige el bug reportado**: los 9 duplicados existentes se limpian automáticamente en la migración (conserva el más reciente).
- **Sin cambios en la entidad**: el índice se gestiona solo por migración; `schedule.entity.ts` no cambia.

### Negativas
- **`update()` puede romper unicidad si se cambia de día vía API** a un día ya ocupado (500 por el índice). Mitigado en la UI y aceptado como riesgo bajo (depende del flujo real).
- **El índice no considera `isActive`**: dos horarios para el mismo día con distinto `isActive` no son posibles; un día inactivo sigue ocupando su registro (para re-crearlo hay que re-activarlo o borrarlo).
- **TOCTOU residual en `create()`** (check-then-insert) mitigado por el índice de BD; no requiere bloqueo adicional.
- Requiere migración de base de datos pendiente de ejecutar (`npm run migration:run`), destructiva solo sobre duplicados.

## Impacto en .docs

- `decisions/ADR-018-unicidad-horario-por-dia.md` (este documento).
- `requirements/mvp-scope.md`: sub-punto de la invariante "máx 1 registro por día/barbero" en la sección "Gestión de barbers (Administrator)".
- `changelog/2026.md`: entrada con fecha 2026-08-16.

## Impacto en código

- `backend/src/modules/schedule/services/schedule.service.ts`: `create()` con chequeo de unicidad (`findOne({barberId, dayOfWeek})` → `BusinessRuleViolation`); `update()` intacto.
- `backend/src/modules/schedule/services/schedule.service.spec.ts`: tests de unicidad en `create()` y test de `update()` sin chequeo.
- `backend/src/database/migrations/1786860784035-EnforceUniqueSchedulePerBarberDay.ts`: dedupe + índice único parcial.
- Sin cambios en la entidad `schedule.entity.ts` (el índice se gestiona por migración).
