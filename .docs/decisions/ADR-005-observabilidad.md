# ADR-005: Observabilidad (Logging, Errores y Monitoreo)

**Estado:** ACEPTADO
**Fecha:** 2026-07-27
**Contexto:**
Se necesita una estrategia de observabilidad para entender qué sucede en el sistema en producción. Esto incluye logging estructurado, manejo global de excepciones, captura de errores y monitoreo de rendimiento.

## Decisión

### Logging: Winston

Se usará **Winston** como logger estructurado.

```typescript
// shared/logger/winston.config.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: { service: 'trimflow-api' },
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? format.combine(format.colorize(), format.simple())
        : format.json(),
    }),
  ],
});
```

### Manejo global de excepciones: Filtro Global de NestJS

Se implementará un **Exception Filter global** que:

- Captura todas las excepciones no manejadas.
- Formatea respuestas de error consistentes en formato JSON.
- Registra el error con Winston con stack trace completo en 5xx.
- Omite detalles internos en producción (no exponer stack traces).
- Mapea excepciones de dominio a códigos HTTP apropiados.

```typescript
// shared/filters/global-exception.filter.ts
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  requestId: string;
  timestamp: string;
  path: string;
}
```

### Monitoreo de errores: Sentry (producción)

Se integrará **Sentry** en los entornos de staging y producción para:

- Captura de excepciones no manejadas.
- Agrupación de errores por fingerprint.
- Contexto de usuario y tenant en cada evento.
- Seguimiento de rendimiento (opcional, habilitable vía feature flag).

### Logging por solicitud

Se implementará un **interceptor** que registre:

- Método y ruta de la solicitud entrante.
- Tiempo de respuesta.
- Código de estado.
- ID de solicitud (correlacionado en respuestas).
- ID de tenant autenticado (si aplica).

### Estructura de carpetas

```
src/
  shared/
    logger/
      winston.config.ts
      logger.module.ts
    filters/
      global-exception.filter.ts
      tenant-exception.filter.ts
    interceptors/
      logging.interceptor.ts
      request-id.interceptor.ts
```

## Consecuencias

### Positivas
- Trazabilidad completa de solicitudes.
- Detección temprana de errores en producción.
- Consistent error responses (API predecible).
- Diagnóstico rápido con logs estructurados.

### Negativas
- Costo operativo de Sentry (plan gratuito limitado).
- Overhead mínimo de logging en cada solicitud.
- Dependencia adicional en el proyecto.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Pino** | Más rápido que Winston, pero Winston tiene mejor soporte para formatos múltiples y transportes. Para este proyecto la diferencia de rendimiento es marginal. |
| **Morgan** | Solo para logging HTTP. No cubre logging de aplicación ni errores. |
| **Datadog** | Muy costoso para un proyecto en etapa inicial. Sentry tiene un generoso plan gratuito. |
| **Logtail / Better Stack** | Alternativa viable a largo plazo, pero Sentry es más estándar para error tracking. |

## Impacto en .docs

- Esta decisión puede ser SUPERSEDIDA si el proyecto requiere un proveedor de observabilidad diferente.
