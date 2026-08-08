# ADR-012: Landing pública de reservas (self-service sin registro)

**Estado:** ACEPTADO
**Fecha:** 2026-08-04

**Contexto:**
TrimFlow necesita una **landing pública por barbería** donde un cliente pueda crear una cita **sin registrarse ni autenticarse**. La URL pública se identifica por el **slug** de la barbería (p.ej. `/barberia-el-clasico`). El cliente no tiene cuenta: reserva contra una barbería concreta y su información se guarda como `Customer` de esa sucursal.

Esto choca con el acceso actual al backend: toda la API está protegida con JWT y RBAC (ADR-003, guards de `shared/`). Los endpoints privados asumen un usuario autenticado y operan bajo un tenant, mientras la landing pública no tiene sesión.

Requisitos funcionales (Mapa de Intención):

1. Flujo de reserva: servicio → barbero → fecha/hora → datos del cliente → confirmación.
2. Datos del cliente: **nombre + teléfono + email, con email OBLIGATORIO** (se envía confirmación por email; no hay WhatsApp/SMS en el MVP).
3. Al escribir el email, si ya existe un `Customer` con ese email **en la misma branch**, se autocompletan los campos; si no existe, se crea como customer nuevo.
4. Solo se muestran horarios disponibles.
5. Los horarios **pasados** se muestran pero **bloqueados** (no seleccionables).
6. La disponibilidad respeta: `Branch.openingTime`/`closingTime`, `Schedule.startTime`/`endTime` y el **break del barbero** (ver ADR-011).
7. Break del barbero: un solo bloque por día (ej: turno 10:00–22:00 con break 14:00–16:00).
8. El slug de la barbería se toma de la URL.
9. Requisito admin: al crear una barbería (tenant), el **slug se auto-genera** del nombre mediante slugify; **si ya existe, se añade un sufijo único**; el campo es **opcionalmente editable** para sobrescribirlo.

## Decisión

### 1. Endpoints públicos bajo `/v1/public/:slug`

Se añade un nuevo módulo/controlador público, fuera de los guards globales JWT, con prefijo `public`. La ruta base identifica a la barbería por su slug:

```
GET  /v1/public/:slug                    → metadatos públicos de la barbería (nombre, branch, servicios, barberos)
GET  /v1/public/:slug/availability       → cálculo de disponibilidad (query: serviceId, barberId?, fecha)
POST /v1/public/:slug/customers/lookup   → dado un email, autocompleta un Customer existente de la branch (o 404)
POST /v1/public/:slug/appointments       → crea la reserva (upsert de Customer + creación de Appointment)
```

Consideraciones de seguridad:
- Estos endpoints son **solo lectura pública o de creación atómica**; exponen únicamente datos no sensibles (nombres, servicios, precios, slots).
- Se resuelve el `Tenant`/`Branch` público por slug y se restringe la creación al contexto de esa branch (imposible crear citas en otra barbería).
- Mantienen el **rate limiting global** (`@nestjs/throttler`) y validación de entrada; NO exponen datos internos (emails de clientes ya existentes quedan a salvo en el lookup** solo para el propio email consultado**).
- Auth: no JWT. La confirmación se envía por email al cliente (requisito 2), no hay canal SMS/WhatsApp en MVP.

### 2. Flujo de reserva (cross-cutting frontend + backend)

La landing en el frontend (Next.js App Router) consume los endpoints públicos en 4 pasos:
`servicio → barbero → fecha/hora → datos del cliente → confirmación`.

- El backend calcula disponibilidad real (paso 3).
- En el paso 4, al escribir el email se llama al lookup público para autocompletar; si no existe, se envía con el email y el backend crea el Customer al POST de la cita.

### 3. Cálculo de disponibilidad

Para una fecha, service y barbero dados, los slots válidos se calculan intersectando:

1. **Horario de la tienda** → `Branch.openingTime`–`Branch.closingTime`.
2. **Horario del barbero** → `Schedule.startTime`–`Schedule.endTime` para el `dayOfWeek` de la fecha, solo si `isActive`.
3. **Break del barbero** → se restan `Schedule.breakStartTime`–`Schedule.breakEndTime` (ADR-011).
4. **Bloqueos puntuales** → `AvailabilityBlock` solapados con la fecha (excepciones).
5. **Citas existentes** → solapamientos con `Appointment` del barbero en esa fecha.

Consideraciones de tiempo:
- **Horarios pasados bloqueados (no seleccionables):** los slots cuyos `startTime` caen en el pasado se muestran pero deshabilitados (requisito 5).
- Los slots se generan en **pasos de X minutos** (configurable) y un slot es válido solo si el `Service.durationMinutes` completo cabe antes de cada límite (tienda, fin de turno, break, siguiente cita) y no se solapa con bloqueos ni citas.
- No se muestra ninguna hora no disponible: solo aparecen slots válidos; los pasados se muestran bloqueados.

### 4. Slug auto-generado + editable (requisito admin)

Decisión de comportamiento al crear/editar un `Tenant`:

- **Auto-generación:** el `slug` se deriva de `Tenant.name` mediante **slugify** (minúsculas, sin acentos, espacios → guion).
- **Colisión:** si el slug ya existe el `Tenant.slug` es `UNIQUE`, se añade un **sufijo único** (p.ej. `-2`, `-3` o un hash corto) hasta resolver el conflicto.
- **Editable:** el campo `slug` es **opcionalmente editable** por el administrador para **sobrescribir** el generado (solo inserción/edición; seguirá validándose contra duplicados).
- El slug es inmutable en el uso público solo mientras se mantenga unique; si se cambia, cambia la URL pública (comportamiento aceptado).

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Reutilizar los endpoints privados (JWT) con una clave de servicio** | Rompe el modelo de seguridad: la landing pública no debe tener usuario autenticado; las operaciones deben acotarse al contexto del slug, no a un token amplio. |
| **Tener microservicio/API separada para la landing** | Sobre-ingeniería para el MVP; el monolito modular ya puede exponer el sub-tree `/public` sin JWT sin añadir infraestructura. |
| **Generar un token público por barbería (API key por slug)** | Complejidad innecesaria: al no haber autenticación de cliente, una key expuesta en el frontend no añade seguridad real frente al rate limiting. Se descarta por simplicidad (PH: simplicidad ante todo). |
| **Resolver la barbería por nombre en vez de slug** | Fragilidad: nombres con acentos/espacios/cambios romperían URLs y SEO; el slug es estable y único. |
| **Hacer el slug siempre manual (sin auto-generación)** | Error humano y duplicados; la auto-generación con sufijo único garantiza URLs válidas de serie con override opcional. |

## Consecuencias

### Positivas
- Ofrece **self-service real** (requisito clave del roadmap: "Portal web público para agendar citas" en v2.2), adelantándolo al MVP de la landing.
- No requiere registro de cliente ni sesión; reduce fricción en la reserva.
- El cálculo de disponibilidad reutiliza el núcleo de agendamiento ya existente (citas, schedules, blocks), con un contrato público delgado.
- El slug auto-generado + editable es robusto (único) y flexible (override admin).

### Negativas
- Expone una superficie pública nueva; requiere cuidado con rate limiting y validación para evitar scraping y spam de citas.
- La disponibilidad depende de múltiples tablas (branch/schedule/blocks/appointments); la consulta pública debe ser eficiente y correcta bajo concurrencia para no permitir doble reserva.
- La confirmación depende del email (el MVP no tiene WhatsApp/SMS): si el email falla, el cliente no recibe confirmación (se mitiga con colas BullMQ y reintentos).
- Un cambio de slug altera la URL pública y puede romper enlaces compartidos/marcadores.

## Impacto en .docs

- `decisions/ADR-011-break-horario-barbero.md`: introduce el break que el cálculo de disponibilidad debe restar.
- `architecture/modules.md`: documentar el nuevo módulo/controlador público de reservas y su posición dentro del monolito.
- `requirements/mvp-scope.md`: reflejar la landing pública como parte del alcance MVP.
- `changelog/2026.md`: entrada con fecha y referencia a ADR-011/012.

## Impacto en código

- Backend: nuevo módulo `public` (o controlador) bajo `/v1/public/:slug` con guards exentados de JWT; lógica de disponibilidad; resolutor de tenant/branch por slug.
- Backend: `TenantService` — slugify al crear, sufijo único en colisión, campo `slug` editable opcional.
- Backend: servicio de creación de cita que hace **upsert de Customer** (lookup por email+branch y creación si no existe) antes de crear el `Appointment`.
- Frontend: rutas `/barberia-el-clasico` (página catch-all por slug) con el flujo en 4 pasos + autocompletado por email desde el lookup público.
- Migración de DB para `Schedule.breakStartTime`/`breakEndTime` (ver ADR-011).

---

## Actualización 2026-08-07

La landing pública `/[slug]` se rediseñó con una nueva identidad visual y se **separó el formulario de reserva a una vista propia `/[slug]/reservar`** (patrón del proyecto de referencia). El `BookingWizard` ya **no se embebe en la landing** `/[slug]` (lo que causaba salto de scroll): la landing muestra **solo información de la barbería** (Servicios, Equipo, Horarios, Ubicación) con un CTA de navegación a `/[slug]/reservar` desde el sticky nav y el CTA band. La lógica de reserva, endpoints `/v1/public/:slug` y el cálculo de disponibilidad descritos arriba permanecen intactos; solo cambia la ubicación/estructura de presentación en el frontend. Ver **ADR-014** para la identidad visual nueva.