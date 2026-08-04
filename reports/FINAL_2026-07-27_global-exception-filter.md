# Reporte Técnico Final
## Global Exception Filter y Excepciones de Dominio

> **Generado:** 2026-07-27
> **Proyecto:** TrimFlow
> **Stack:** NestJS 10, TypeScript 5.4
> **Iteraciones realizadas:** 3
> **Veredicto final:** APROBADO

---

## Objetivo confirmado

Implementar el sistema global de manejo de excepciones en `src/shared/`:
- Clase base `DomainException` que extiende `HttpException`
- 7 excepciones de dominio con códigos HTTP específicos
- `GlobalExceptionFilter` con `@Catch()` que captura TODAS las excepciones
- Formato de respuesta estandarizado con `requestId`, `timestamp`, `path`
- Logging estructurado con `TrimflowLoggerService`
- Stack trace solo en entorno no-producción

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | RECHAZADO | Faltaban excepciones de dominio, barrel exports, y TestsProvider |
| 2         | RECHAZADO | Faltaba integración con APP_FILTER y barrel exports |
| 3         | APROBADO | — |

---

## Decisiones técnicas tomadas

### DomainException como clase base

**Qué se decidió:**
`DomainException` extiende `HttpException` y asigna automáticamente `this.name = this.constructor.name`.

**Por qué se tomó esta decisión:**
Permite que cada excepción de dominio herede el comportamiento y que `errorName` en la respuesta refleje el nombre de la clase concreta (ej. `"EntityNotFoundException"`).

**Alternativas descartadas:**
- Extender directamente `Error` y mapear en el filtro: más código repetitivo.
- No usar clase base: cada excepción tendría que implementar el constructor por separado.

**Impacto en .docs:** Ninguno.

### @Catch() sin argumentos (captura global)

**Qué se decidió:**
El decorador `@Catch()` se usa sin argumentos para capturar absolutamente todas las excepciones, incluyendo errores nativos de JS.

**Por qué:**
Previene errores HTTP 500 sin formato cuando ocurre un error inesperado. Toda excepción pasa por el mismo pipeline de logging y respuesta estandarizada.

**Impacto en .docs:** Ninguno.

### requestId en respuestas de error

**Qué se decidió:**
El `GlobalExceptionFilter` lee `X-Request-Id` del header o genera un UUID v4 como fallback, y lo incluye en la respuesta de error.

**Por qué:**
Permite correlacionar errores con las trazas de los interceptores (RequestIdInterceptor). Sin esto, los errores no tendrían identificador de correlación.

**Impacto en .docs:** Ninguno. Es consistente con `observability.md`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/shared/exceptions/domain.exception.ts` | Clase base que extiende HttpException |
| `src/shared/exceptions/entity-not-found.exception.ts` | 404 — Entidad no encontrada |
| `src/shared/exceptions/double-booking-error.exception.ts` | 409 — Conflicto de doble reserva |
| `src/shared/exceptions/tenant-mismatch-error.exception.ts` | 403 — Mismatch de tenant |
| `src/shared/exceptions/unauthorized-error.exception.ts` | 401 — No autenticado |
| `src/shared/exceptions/forbidden-error.exception.ts` | 403 — No autorizado por rol |
| `src/shared/exceptions/validation-error.exception.ts` | 422 — Error de validación |
| `src/shared/exceptions/business-rule-violation.exception.ts` | 422 — Violación de regla de negocio |
| `src/shared/exceptions/index.ts` | Barrel export |
| `src/shared/filters/global-exception.filter.ts` | Filtro global @Catch() con logging y requestId |
| `src/shared/filters/index.ts` | Barrel export |

### Archivos modificados

| Archivo | Qué cambió | Por qué |
|---------|-----------|---------|
| `src/app.module.ts` | Se agregó provider `APP_FILTER` con `GlobalExceptionFilter` | Para que NestJS registre el filtro globalmente |

---

## Cambios en archivos clave

### `src/shared/exceptions/domain.exception.ts`

**Antes:** No existía.
**Después:** Clase base que recibe `message` y `status`, asigna `this.name` automáticamente.

### `src/shared/filters/global-exception.filter.ts`

**Antes:** No existía.
**Después:** Filtro global con:
- `@Catch()` sin argumentos
- Extracción de `requestId` desde header o generación por UUID/timestamp
- Manejo de `HttpException` (string | object | array message)
- Fallback a 500 para errores no mapeados
- Stack trace exclusivo en no-producción
- Logging con `TrimflowLoggerService` + `requestId`
- Formato de respuesta: `{ statusCode, message, error, requestId, timestamp, path }`

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| DomainException extiende HttpException | ✅ Cumplido | `domain.exception.ts:3-7` |
| 7 excepciones con códigos HTTP correctos | ✅ Cumplido | 404, 409, 403, 401, 403, 422, 422 |
| @Catch() sin argumentos | ✅ Cumplido | Captura TODAS las excepciones |
| Formato de respuesta estandarizado | ✅ Cumplido | `{ statusCode, message, error, requestId, timestamp, path }` |
| requestId en cada respuesta de error | ✅ Cumplido | Desde header o generado |
| Stack trace solo en no-producción | ✅ Cumplido | Condicional `!isProduction` |
| HttpException nativas manejadas | ✅ Cumplido | String, object, array message |
| Errores no mapeados → 500 genérico | ✅ Cumplido | Fallback en catch |
| Logging con TrimflowLoggerService | ✅ Cumplido | Con requestId seteado |
| APP_FILTER en providers | ✅ Cumplido | `app.module.ts:61-66` |
| Build sin errores | ✅ Cumplido | `npm run build` exitoso |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | Las excepciones de dominio se usan con datos mock (auth service). Al conectar BD real, algunas pueden necesitar ajustes | BAJA | `auth.service.ts` | Antes de producción |

---

## Lo que el programador debe saber

1. **Para lanzar una excepción de dominio:** `throw new EntityNotFoundException('Barber')` — el filtro la captura y devuelve el formato estándar.
2. **Toda respuesta de error** incluye `requestId` para correlación con las trazas de los interceptores.
3. **En desarrollo** verás el `stack trace` completo. En producción se omite.
4. **Errores inesperados** (errores nativos de JS) siempre devuelven 500 con mensaje genérico.
5. **Si agregas una nueva excepción:** extiéndela de `DomainException` y expórtala desde `exceptions/index.ts`. No necesitas modificar el filtro.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1 | `reports/2026-07-27_global-exception-filter_iter1.md` |
| 2 | `reports/2026-07-27_global-exception-filter_iter2.md` |
| 3 | `reports/2026-07-27_global-exception-filter_iter3.md` |
