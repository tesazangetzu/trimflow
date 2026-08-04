# API Versioning

Consulte `ADR-003` para la justificación de las decisiones técnicas.

## Estrategia

Versionado por **prefijo en la URL**: `/v1/`, `/v2/`, etc.

## Formato

```
GET    /v1/appointments
POST   /v1/appointments
GET    /v1/appointments/:id
PATCH  /v1/appointments/:id
DELETE /v1/appointments/:id

GET    /v1/barbers
POST   /v1/barbers

GET    /v1/tenants
POST   /v1/tenants

POST   /v1/auth/login
POST   /v1/auth/refresh
```

## Implementación

En NestJS, se configura el prefijo global en `main.ts`:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  await app.listen(3000);
}
```

## Ciclo de vida de versiones

| Versión | Estado | Lanzamiento | Fin de soporte |
|---------|--------|-------------|----------------|
| v1 | Activa (MVP) | 2026-Q3 | — |
| v2 | Planeada | 2027-Q1 | — |

## Política de cambios

### Cambios que REQUIEREN nueva versión

- Renombrar o eliminar campos existentes.
- Cambiar tipo de campos existentes.
- Hacer campos requeridos que antes eran opcionales.
- Cambiar semántica de un endpoint.
- Eliminar un endpoint.

### Cambios que NO requieren nueva versión

- Añadir campos opcionales al response.
- Añadir nuevos endpoints.
- Corregir bugs que alinean el comportamiento con la especificación.
- Mejorar rendimiento (sin cambiar contrato).

## Headers de respuesta

Toda respuesta incluye:

```
X-API-Version: 1
X-Request-Id: req_abc123
```

## Documentación

Cada endpoint se documenta con su versión explícita:

```typescript
@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  // ...
}
```

(Alternativa: usar `@nestjs/common` Versioning si se prefiere, pero mantener `/v1/` visible en la URL.)
