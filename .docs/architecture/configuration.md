# Gestión de Configuración y Variables de Entorno

Consulte `ADR-004` para la justificación de las decisiones técnicas.

## Esquema de archivos

```
📁 proyecto/
  ├── .env                       # Template con valores dummy (commiteado)
  ├── .env.development           # Desarrollo local (NO commiteado)
  ├── .env.staging               # Staging (gestionado por CI/CD)
  ├── .env.production            # Producción (gestionado por CI/CD o secret manager)
  ├── .env.example               # Template de ejemplo (commiteado)
  └── src/
      └── config/
          ├── configuration.ts   # Tipado y carga de config
          └── validation.schema.ts  # Esquema Joi
```

## Variables de entorno

### Obligatorias (todas)

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `NODE_ENV` | `string` | `development` | Entorno: `development`, `staging`, `production` |
| `PORT` | `number` | `3000` | Puerto del servidor HTTP |
| `DATABASE_URL` | `string` | — | URL de conexión PostgreSQL (`postgresql://user:pass@host:5432/db`) |
| `REDIS_URL` | `string` | — | URL de conexión Redis (`redis://user:pass@host:6379`) |
| `JWT_SECRET` | `string` | — | Secreto para firmar JWT (mín. 32 caracteres) |
| `JWT_REFRESH_SECRET` | `string` | — | Secreto para Refresh Token (mín. 32 caracteres) |
| `JWT_EXPIRES_IN` | `string` | `15m` | Tiempo de expiración del JWT |
| `JWT_REFRESH_EXPIRES_IN` | `string` | `7d` | Tiempo de expiración del Refresh Token |

### Opcionales

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `API_PREFIX` | `string` | `v1` | Prefijo global de API |
| `CORS_ORIGINS` | `string` | `*` | Orígenes CORS separados por coma |
| `LOG_LEVEL` | `string` | `debug` (dev) / `info` (prod) | Nivel mínimo de log |
| `SENTRY_DSN` | `string` | — | DSN de Sentry (requerido en producción) |
| `SMTP_HOST` | `string` | — | Host SMTP para envío de emails |
| `SMTP_PORT` | `number` | `587` | Puerto SMTP |
| `SMTP_USER` | `string` | — | Usuario SMTP |
| `SMTP_PASS` | `string` | — | Contraseña SMTP |
| `SMTP_FROM` | `string` | — | Dirección remitente de emails |
| `TENANT_DB_SCHEMA_PREFIX` | `string` | `tenant_` | Prefijo para esquemas de base de datos por tenant |
| `RATE_LIMIT_TTL` | `number` | `60` | TTL para rate limiting (segundos) |
| `RATE_LIMIT_MAX` | `number` | `100` | Máximo de solicitudes por TTL |

## Validación (Joi)

El esquema de validación se encuentra en `src/config/validation.schema.ts`. La aplicación **no inicia** si:

1. Una variable requerida no está definida.
2. Una variable tiene un tipo incorrecto.
3. Una variable con formato específico (URL, email) no cumple el formato.

```typescript
// Ejemplo de validación
JWT_SECRET: Joi.string()
  .min(32)
  .required()
  .messages({
    'string.min': 'JWT_SECRET must be at least 32 characters long',
    'any.required': 'JWT_SECRET is required',
  });
```

## Acceso a configuración en el código

Toda la configuración se accede a través del `ConfigService` tipado de NestJS:

```typescript
@Injectable()
export class AppointmentService {
  constructor(private configService: ConfigService) {
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    const port = this.configService.get<number>('PORT');
  }
}
```

## Buenas prácticas

- **Nunca** hardcodear valores de configuración en el código.
- **Nunca** commitear `.env` con valores reales.
- **Siempre** mantener actualizado `.env.example`.
- **Siempre** validar la configuración al iniciar la aplicación.
- **Nunca** loguear valores sensibles (secrets, tokens, contraseñas).
