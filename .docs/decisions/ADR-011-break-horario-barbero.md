# ADR-011: Break del horario del barbero (un solo bloque por día)

**Estado:** ACEPTADO
**Fecha:** 2026-08-04

**Contexto:**
La landing pública de reservas debe mostrar solo horarios reales de disponibilidad del barbero. Para calcular esa disponibilidad, además del horario de la tienda (`Branch.openingTime`/`closingTime`) y del horario del barbero (`Schedule.startTime`/`endTime`), se debe respetar el **break** (periodo de descanso) del barbero.

El modelo de datos actual no soporta el break: la entidad `Schedule` (backend/src/modules/schedule/entities/schedule.entity.ts) solo tiene `dayOfWeek`, `startTime`, `endTime` e `isActive`. No existe ningún campo ni tabla que represente el descanso diario de un barbero. La base de datos ya cuenta con `AvailabilityBlock` (bloqueos puntuales por fecha concreta, `startDateTime`/`endDateTime` + `reason`), pero su semántica no es recurrente sino de excepción puntual.

Requisito funcional concreto (Mapa de Intención):
- El break del barbero es **un único bloque por día** dentro de su turno (ej: turno 10:00–22:00 con break 14:00–16:00).
- El break debe respetarse en el cálculo de disponibilidad pública y encajar dentro de `Schedule.startTime`/`endTime`.

## Decisión

Añadir **dos columnas nullable de tipo `time without time zone`** a la entidad `Schedule`:

- `breakStartTime: string | null`
- `breakEndTime: string | null`

Ambos campos representan el break diario del barbero en su `dayOfWeek` correspondiente. Como es **un único bloque por día**, dos campos bastan: inicio y fin del descanso. Si no se define break (valores `NULL`), no se aplica descanso ese día.

### Definición propuesta de columnas

```typescript
@Column({ type: 'time without time zone', nullable: true })
breakStartTime?: string;

@Column({ type: 'time without time zone', nullable: true })
breakEndTime?: string;
```

### Reglas de validación

- Ambos campos deben estar **o nulos o ambos presentes**; no se permite un break con solo un extremo definido.
- `breakStartTime < breakEndTime` siempre.
- El break debe estar **contenido dentro** de `Schedule.startTime`–`Schedule.endTime`.
- El break NO puede solaparse con las citas del barbero (se valida al calcular disponibilidad).

### Migración requerida

Este cambio requiere una **migración de base de datos** (siguiendo ADR-006): añade las dos columnas nullable a la tabla `schedules` sin datos retroactivos (los schedules existentes quedan con `NULL`, es decir, sin break). No es destructivo y no requiere backfill.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Tabla separada de bloques de descanso** (`break_blocks` con FK a `schedule`/`barber`) | Sobre-ingeniería para el requisito actual: añade una tabla, relación y consulta extra para modelar un dato tan simple como "inicio y fin de un descanso". No se descarta como evolución futura si algún día se soportan múltiples breaks por día (entonces esta alternativa ganaría peso). |
| **Reusar `AvailabilityBlock` con recurrencia** | Rompe dos invariantes actuales: (1) `AvailabilityBlock` es puntual por fecha (`startDateTime`/`endDateTime` timestamptz), no recurrente por día de semana; (2) mezclaría dos conceptos distintos (excepción puntual vs. descanso recurrente) en la misma entidad, complicando la consulta de disponibilidad y su significado. Añadir recurrencia a una tabla de excepciones abarata el modelo conceptual. |
| **Guardar el break en JSON dentro de `Schedule`** | Menos tipado, sin ventaja real sobre dos columnas; complica consultas y validaciones. |

## Consecuencias

### Positivas
- Modelo mínimo: un solo bloque por día se representa con exactamente dos columnas.
- Sin tablas nuevas ni relación adicional; la consulta de disponibilidad sigue siendo simple.
- Retrocompatible: `NULL` por defecto para schedules existentes.
- Aprovecha el tipo `time without time zone` ya usado en `startTime`/`endTime` de la misma tabla.

### Negativas
- No soporta **múltiples breaks por día** (p.ej. dos pausas). Si el requisito evoluciona, habría que migrar a una tabla separada.
- No distingue tipo/razón de descanso (almuerzo, descanso técnico, tarjetas de validación...). Para el requisito actual no es necesario.
- Requiere una migración de base de datos y la correspondiente actualización de DTOs y del flujo de creación/edición de schedules.

## Alternativas futuras (fuera de alcance)
Si en el futuro se necesitan múltiples breaks o breaks con atributos (motivo, booleano de visibilidad pública), la opción natural será una tabla `schedules_breaks` con FK a `schedule` y columnas `startTime`/`endTime`, y `Schedule` pasaría a tener una relación `OneToMany`. Este ADR deja documentado ese punto de evolución.

## Impacto en .docs

- `decisions/ADR-012-landing-publica-reservas.md`: el cálculo de disponibilidad debe restar el break (`breakStartTime`–`breakEndTime`) de los slots válidos del barbero.

## Impacto en código

- `backend/src/modules/schedule/entities/schedule.entity.ts`: añadir las dos columnas nullable.
- Migración nueva en `backend/src/database/migrations/` (siguiendo ADR-006): `ALTER TABLE schedules ADD COLUMN breakStartTime time, ADD COLUMN breakEndTime time`.
- DTOs y servicio de `schedule` para crear/editar el break con sus validaciones.
- Servicio de cálculo de disponibilidad (público): restar el break de los slots.