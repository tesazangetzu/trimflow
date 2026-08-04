# Auditoría: GlobalExceptionFilter y Excepciones de Dominio

**Fecha:** 2026-07-27  
**Iteración:** 3  
**Auditor:** Agente Auditor

---

## Resumen

| Archivo | Estado |
|---------|--------|
| `src/shared/exceptions/domain.exception.ts` | ✅ OK |
| `src/shared/exceptions/entity-not-found.exception.ts` | ✅ OK |
| `src/shared/exceptions/double-booking-error.exception.ts` | ✅ OK |
| `src/shared/exceptions/tenant-mismatch-error.exception.ts` | ✅ OK |
| `src/shared/exceptions/unauthorized-error.exception.ts` | ✅ OK |
| `src/shared/exceptions/forbidden-error.exception.ts` | ✅ OK |
| `src/shared/exceptions/validation-error.exception.ts` | ✅ OK |
| `src/shared/exceptions/business-rule-violation.exception.ts` | ✅ OK |
| `src/shared/exceptions/index.ts` | ✅ OK |
| `src/shared/filters/global-exception.filter.ts` | ✅ OK |
| `src/shared/filters/index.ts` | ✅ OK |
| `src/app.module.ts` | ✅ OK |
| `npm run build` | ✅ OK |

---

## Verificación por criterio

### 1. DomainException base
**Esperado:** Extiende `HttpException`, constructor recibe `message` + `status`.  
**Real:** `domain.exception.ts:3-7` — `class DomainException extends HttpException` con constructor `(message: string, status: number)`. ✅

### 2. Siete excepciones con HTTP codes correctos
| Excepción | Archivo | Código | Esperado |
|-----------|---------|--------|----------|
| `EntityNotFoundException` | `entity-not-found.exception.ts:4-5` | 404 | 404 ✅ |
| `DoubleBookingError` | `double-booking-error.exception.ts:4-5` | 409 | 409 ✅ |
| `TenantMismatchError` | `tenant-mismatch-error.exception.ts:4-5` | 403 | 403 ✅ |
| `UnauthorizedError` | `unauthorized-error.exception.ts:4-5` | 401 | 401 ✅ |
| `ForbiddenError` | `forbidden-error.exception.ts:4-5` | 403 | 403 ✅ |
| `ValidationError` | `validation-error.exception.ts:4-5` | 422 | 422 ✅ |
| `BusinessRuleViolation` | `business-rule-violation.exception.ts:4-5` | 422 | 422 ✅ |

Todas extienden `DomainException` con mensaje por defecto. ✅

### 3. @Catch() sin argumentos
**Esperado:** Captura TODAS las excepciones.  
**Real:** `global-exception.filter.ts:12` — `@Catch()` sin argumentos. ✅

### 4. Formato de respuesta
**Esperado:** `{ statusCode, message, error, requestId, timestamp, path }`.  
**Real:** `global-exception.filter.ts:68-75` — estructura exacta con todos los campos. ✅

### 5. requestId
**Esperado:** Del header `X-Request-Id` o generado.  
**Real:** `global-exception.filter.ts:26-29` — Lee `x-request-id`, fallback a `crypto.randomUUID()`, fallback a timestamp+random. ✅

### 6. Stack trace solo en no-producción
**Esperado:** `stack` excluido en producción.  
**Real:** `global-exception.filter.ts:77-79` — `if (!isProduction && exception instanceof Error)`. ✅

### 7. HttpException nativas manejadas correctamente
**Esperado:** status, message, error extraídos correctamente.  
**Real:** `global-exception.filter.ts:35-64` — Maneja string, object (incluyendo `message` como array), y fallback. Caso especial `500 → Internal Server Error`. ✅

### 8. Errores no mapeados → 500 genérico
**Esperado:** Excepción que no es `HttpException` → 500.  
**Real:** `global-exception.filter.ts:60-64` — `status = 500`, `message` del `Error.message` o genérico. ✅

### 9. Logging con TrimflowLoggerService y requestId
**Esperado:** Usa `TrimflowLoggerService` con `requestId` seteado.  
**Real:** `global-exception.filter.ts:14,81-85` — Inyecta `TrimflowLoggerService`, settea `this.logger.requestId = requestId`, llama `this.logger.error` con mensaje y stack. ✅

### 10. APP_FILTER en providers de app.module.ts
**Esperado:** Provider `APP_FILTER` con `GlobalExceptionFilter`.  
**Real:** `app.module.ts:61-66` — `{ provide: APP_FILTER, useClass: GlobalExceptionFilter }`. ✅

### 11. Build sin errores
**Esperado:** `npm run build` exitoso.  
**Real:** Build completado sin errores ni warnings. ✅

---

## Observaciones adicionales

- **Barrel exports** en `src/shared/exceptions/index.ts` exportan las 8 clases. ✅
- **Barrel exports** en `src/shared/filters/index.ts` exporta `GlobalExceptionFilter`. ✅
- El `GlobalExceptionFilter` usa `ConfigService` para detectar producción (`NODE_ENV`). ✅
- `TrimflowLoggerService` es de ámbito `Scope.TRANSIENT` lo cual es correcto para evitar conflictos de estado entre requests. ✅
- El `errorName` para excepciones de dominio usa `exception.name` (e.g. `"DoubleBookingError"`), lo cual es informativo y coincide con el `name` seteado en `DomainException`. ✅

---

## Veredicto

**APROBADO** — Todos los criterios se cumplen sin fallas.