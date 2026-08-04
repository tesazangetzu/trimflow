# Reporte Técnico Final
## 3 Interceptores Globales — RequestId, Logging, Transform

> **Generado:** 2026-07-27 19:45 UTC
> **Proyecto:** TrimFlow
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO

---

## Objetivo confirmado

Implementar los 3 interceptores globales en `src/shared/interceptors/` según `.docs/architecture/observability.md`:
1. **RequestIdInterceptor** — genera/propaga X-Request-Id
2. **LoggingInterceptor** — registra cada solicitud HTTP
3. **TransformInterceptor** — unifica respuestas exitosas

---

## Decisiones técnicas tomadas

### Scope TRANSIENT del Logger → propagación manual de requestId

**Qué se decidió:**
Cada interceptor setea `logger.requestId` individualmente porque `TrimflowLoggerService` usa `Scope.TRANSIENT`.

**Por qué:**
Al ser TRANSIENT, cada inyección es una instancia diferente. Si solo RequestIdInterceptor setea el requestId, los otros interceptores no lo heredan.

**Impacto:** LoggingInterceptor incluye `this.logger.requestId = request.requestId` al inicio de `intercept()`.

### Orden de ejecución: RequestId → Logging → Transform

**Qué se decidió:**
Se registran en ese orden en `providers[]`. NestJS ejecuta los interceptores globales en el orden de declaración.

**Justificación:**
1. RequestId genera el ID antes que nada
2. Logging mide el tiempo total (incluyendo transformación)
3. Transform aplica el formato estándar justo antes de responder

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `shared/interceptors/request-id.interceptor.ts` | UUID v4 en X-Request-Id, propagación a request y logger |
| `shared/interceptors/logging.interceptor.ts` | Log de método, ruta, status, duración por solicitud |
| `shared/interceptors/transform.interceptor.ts` | Envuelve respuesta exitosa en `{ statusCode, message, data, requestId, timestamp }` |
| `shared/interceptors/index.ts` | Barrel export |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app.module.ts` | Se agregaron 3 providers APP_INTERCEPTOR + import de APP_INTERCEPTOR |

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| RequestId genera UUID | ✅ | crypto.randomUUID() en request-id.interceptor.ts |
| Header X-Request-Id en respuesta | ✅ | response.setHeader('X-Request-Id', requestId) |
| requestId en request | ✅ | request.requestId = requestId |
| Logging mide duración | ✅ | Date.now() pre/post handle |
| Error logging con warn | ✅ | tap.error con HttpException.getStatus() |
| Transform formato estándar | ✅ | statusCode, message, data, requestId, timestamp |
| Orden de interceptores | ✅ | RequestId → Logging → Transform en providers |
| Build | ✅ | npm run build sin errores |

---

## Lo que el programador debe saber

1. **Toda respuesta exitosa** ahora incluye `requestId` y `timestamp`. Ejemplo:
   ```json
   {
     "statusCode": 200,
     "message": "OK",
     "data": { ... },
     "requestId": "550e8400-e29b-41d4-a716-446655440000",
     "timestamp": "2026-07-27T19:45:00.000Z"
   }
   ```
2. **Toda respuesta** (éxito y error) tiene el header `X-Request-Id` para correlación.
3. **Cada solicitud** se loggea automáticamente: `GET /v1/... 200 5ms`
4. **Las respuestas de error NO pasan por TransformInterceptor** — van directo al GlobalExceptionFilter.
5. **Próximo paso recomendado:** Guards de autenticación (AuthModule) o arrancar con módulos de dominio (Tenants, Auth).
