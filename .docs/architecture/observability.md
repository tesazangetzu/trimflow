# Observabilidad: Logging, Errores y Monitoreo

Consulte `ADR-005` para la justificación de las decisiones técnicas.

## Logging con Winston

### Configuración

El logger se configura en `src/shared/logger/winston.config.ts` y se expone como módulo global de NestJS.

### Niveles de log por entorno

| Entorno | Nivel mínimo | Formato |
|---------|-------------|---------|
| Desarrollo | `debug` | Coloreado + texto legible |
| Staging | `info` | JSON estructurado |
| Producción | `info` | JSON estructurado |

### Metadatos incluidos

Toda entrada de log incluye:
- `timestamp` (ISO 8601)
- `level` (debug, info, warn, error)
- `service` (`trimflow-api`)
- `requestId` (correlación)
- `tenantId` (si está autenticado)
- `userId` (si está autenticado)
- `stack` (solo en errores)

### Ejemplo de salida (producción)

```json
{
  "timestamp": "2026-07-27T10:30:00.000Z",
  "level": "error",
  "message": "Appointment creation failed",
  "service": "trimflow-api",
  "requestId": "req_abc123",
  "tenantId": "tenant_42",
  "userId": "user_17",
  "error": {
    "name": "DoubleBookingError",
    "message": "Barber already has an appointment at 2026-07-27T14:00:00",
    "stack": "..."
  }
}
```

## Manejo global de excepciones

### Formato de respuesta de error

```typescript
// Todas las respuestas de error siguen esta estructura:
{
  "statusCode": 409,
  "message": "Barber already has an appointment at this time",
  "error": "Conflict",
  "requestId": "req_abc123",
  "timestamp": "2026-07-27T10:30:00.000Z",
  "path": "/v1/appointments"
}
```

### Mapeo de excepciones

| Excepción de dominio | Código HTTP |
|----------------------|-------------|
| `EntityNotFoundException` | 404 |
| `DoubleBookingError` | 409 |
| `TenantMismatchError` | 403 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `ValidationError` | 422 |
| `BusinessRuleViolation` | 422 |
| Error no mapeado | 500 (sin stack trace en producción) |

### Filtro global

El `GlobalExceptionFilter` captura en orden:
1. Excepciones HTTP nativas de NestJS.
2. Excepciones de dominio del negocio.
3. Errores de validación (class-validator).
4. Errores no manejados (500 genérico).

## Monitoreo con Sentry

### Integración

Sentry se integra solo en staging y producción. En desarrollo se desactiva.

```typescript
// main.ts (producción)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% de solicitudes con tracing
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
});
```

### Datos capturados

- Excepciones no manejadas.
- Errores de validación críticos.
- Transacciones de API lentas (> 1s).
- Contexto: `tenantId`, `userId`, `requestId`, `branchId`.

## Logging por solicitud (Interceptor)

Cada solicitud HTTP se registra automáticamente:

| Atributo | Descripción |
|----------|-------------|
| Método | GET, POST, PUT, DELETE... |
| Ruta | `/v1/appointments` |
| Status | 200, 201, 404, 500... |
| Duración | `123ms` |
| Request ID | `req_abc123` |
| Tenant ID | `tenant_42` (si autenticado) |

## Request ID

Cada solicitud recibe un UUID único (`requestId`) que se:
1. Genera en un interceptor al recibir la solicitud.
2. Propaga a todos los logs de esa solicitud.
3. Incluye en la respuesta HTTP como header `X-Request-Id`.
