# ADR-004: Gestión de Configuración y Variables de Entorno

**Estado:** ACEPTADO
**Fecha:** 2026-07-27
**Contexto:**
Se necesita un mecanismo robusto para gestionar la configuración de la aplicación en diferentes entornos (desarrollo, staging, producción). La configuración incluye credenciales de base de datos, Redis, JWT secrets, y opciones específicas del negocio.

## Decisión

Se usará **`@nestjs/config`** con **validación mediante Joi**.

### Esquema de archivos `.env`

```
.env                  # Valores por defecto (compartidos en repo con valores dummy)
.env.development      # Desarrollo local (no commiteado)
.env.staging          # Entorno de staging (gestionado por CI/CD)
.env.production       # Producción (gestionado por CI/CD o secret manager)
```

### Carga de archivos

NestJS Config Module cargará en orden de prioridad ascendente:
1. `.env` (valores base)
2. `.env.{NODE_ENV}` (sobrescribe según entorno)
3. Variables de entorno del sistema (máxima prioridad)

### Validación con Joi

Todas las variables serán validadas al iniciar la aplicación. Si falta una variable requerida o tiene formato inválido, la aplicación **no iniciará**.

```typescript
// config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  // ...
});
```

### Variables requeridas mínimas

| Variable | Descripción | Entornos |
|----------|-------------|----------|
| `NODE_ENV` | Entorno de ejecución | Todos |
| `PORT` | Puerto del servidor | Todos |
| `DATABASE_URL` | URL de conexión PostgreSQL | Todos |
| `REDIS_URL` | URL de conexión Redis | Todos |
| `JWT_SECRET` | Secreto para JWT (mín. 32 chars) | Todos |
| `JWT_REFRESH_SECRET` | Secreto para Refresh Token (mín. 32 chars) | Todos |
| `JWT_EXPIRES_IN` | Tiempo de expiración JWT (ej. `15m`) | Todos |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo de expiración Refresh Token (ej. `7d`) | Todos |
| `TENANT_DB_SCHEMA_PREFIX` | Prefijo para esquemas de tenant (ej. `tenant_`) | Todos |
| `SMTP_HOST` | Host del servidor SMTP | Producción, Staging |
| `SMTP_PORT` | Puerto SMTP | Producción, Staging |
| `SENTRY_DSN` | DSN de Sentry para monitoreo | Producción, Staging |
| `CORS_ORIGINS` | Orígenes permitidos separados por coma | Todos |

### Estructura de carpetas

```
src/
  config/
    configuration.ts        # ConfigService tipado
    validation.schema.ts    # Esquema Joi
    env.d.ts                # Tipos para process.env (opcional)
```

## Consecuencias

### Positivas
- Validación temprana: errores de configuración se detectan al iniciar.
- Tipado seguro con ConfigService.
- Separación clara por entorno.
- Estándar del ecosistema NestJS.

### Negativas
- Dependencia de `@nestjs/config` y `joi`.
- Los secrets en producción deben gestionarse externamente (no solo con `.env`).
- Riesgo de commiteo accidental de `.env` real.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Zod** | Excelente, pero Joi tiene mejor integración documentada con `@nestjs/config`. |
| **Variables sin validación** | Riesgo alto de errores en producción por configuración incorrecta. |
| **Archivos YAML/JSON** | Menos estándar en el ecosistema Node.js; los `.env` son más universales. |

## Impacto en .docs

- La documentación de despliegue debe listar todas las variables requeridas.
