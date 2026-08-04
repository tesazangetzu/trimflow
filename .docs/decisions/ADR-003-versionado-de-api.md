# ADR-003: Versionado de API

**Estado:** ACEPTADO
**Fecha:** 2026-07-27
**Contexto:**
Se necesita definir cómo se versionará la API REST para permitir evolución del contrato sin romper clientes existentes. Las opciones incluyen versionado en URL, header de contenido, header personalizado, o ausencia de versionado.

## Decisión

Se usará **versionado por prefijo en la URL**: `/v1/`, `/v2/`.

### Formato

```
GET /v1/appointments
POST /v1/appointments
GET /v1/barbers
```

### Reglas

- La versión actual activa será siempre la más reciente.
- Cada versión tendrá una vida útil mínima de **6 meses** desde que se lanza la siguiente.
- Las rutas sin versión (`/appointments`) retornarán `301 Redirect` a la última versión estable.
- El versionado se implementará a nivel de controlador con un prefijo global configurable en NestJS:

```typescript
// main.ts o app.module
app.setGlobalPrefix('v1');
```

### Cuándo versionar

- Cuando se modifican campos de request/response de forma incompatible.
- Cuando se elimina un endpoint.
- Cuando cambia la semántica de un endpoint.

### Cuándo NO versionar

- Adición de campos opcionales en response (los clientes deben ignorar campos desconocidos).
- Adición de nuevos endpoints.
- Corrección de bugs que alinean el comportamiento con la especificación original.

## Consecuencias

### Positivas
- URLs auto-documentadas y fáciles de depurar.
- Implementación simple con NestJS (`setGlobalPrefix`).
- No requiere headers especiales para versionar.

### Negativas
- URLs más largas.
- Duplicación potencial de controladores si no se gestiona bien.
- Clientes deben actualizar URLs al migrar de versión.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Header Accept-Version** | Menos visible en logs y debugging; más difícil de testear desde navegador. |
| **Header personalizado (X-API-Version)** | Misma desventaja que Accept-Version; no es estándar REST. |
| **Sin versionado** | Inviable para un SaaS multi-tenant que evolucionará; rompería clientes. |

## Impacto en .docs

- La documentación de API debe especificar la versión en cada endpoint.
