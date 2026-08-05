# Reporte Técnico Final
## Landing pública de reservas por slug

> **Generado:** 2026-08-04
> **Proyecto:** TrimFlow (SaaS multi-tenant de barberías)
> **Stack:** NestJS 10 + TypeORM + PostgreSQL (backend) · Next.js 16.2.12 + React 19 + Tailwind 4 (frontend)
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

Landing pública por barbería (slug en ruta, ej: `/barberia-el-clasico`) donde clientes crean citas sin registro, + endpoints públicos en el backend que calculan disponibilidad real.

**Éxito cuando:**
- Cliente entra a `/barberia-el-clasico` y reserva: servicio → barbero → fecha/hora → datos → confirmación.
- Al escribir el email, si el cliente ya existe (mismo branch), se autocompletan los campos.
- Solo se muestran horarios disponibles (respetando horario de tienda, horario del barbero y su break).
- Los horarios pasados se ven pero bloqueados (no seleccionables).
- El staff sigue entrando por `/` (login). No se toca login ni dashboards.

**Fuera de alcance:** login/dashboards de staff, compra de dominio/subdominios, pagos (MercadoPago).

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | — (ninguna CRÍTICA/ALTA; solo MEDIA/BAJA) |

---

## Decisiones técnicas tomadas

### 1. Break del barbero como campos en Schedule (ADR-011)

**Qué se decidió:** añadir `breakStartTime`/`breakEndTime` (nullable, `time`) a la entidad `Schedule` para representar un único bloque de descanso por día.

**Por qué:** el modelo previo solo tenía un turno continuo `startTime`/`endTime`. El requisito exige respetar un break (ej: 10am-11pm con descanso 2pm-4pm). Un solo bloque por día confirmado por el programador.

**Alternativas descartadas:** tabla separada de bloques de descanso (sobre-ingeniería para un solo break), reutilizar `AvailabilityBlock` con recurrencia (rompería su semántica puntual por fecha).

**Impacto en .docs:** ADR-011 creado; requiere migración (ADR-006).

**Impacto en el código:** `Schedule` entity, DTOs, `ScheduleService.isBarberAvailable`, migración `1785888933801-AddScheduleBreak`.

### 2. Endpoints públicos sin JWT bajo `/v1/public/:slug` (ADR-012)

**Qué se decidió:** un módulo `public` con 4 endpoints sin guards JWT: `GET /:slug`, `GET /:slug/availability`, `POST /:slug/customers/lookup`, `POST /:slug/appointments`.

**Por qué:** los guards JWT se aplican por controlador (no globales), así que el módulo público solo omite `@UseGuards`. El rate limiting global (`ThrottlerGuard`) queda activo automáticamente.

**Alternativas descartadas:** endpoints privados con clave de servicio, microservicio separado, API key por barbería.

**Impacto en .docs:** ADR-012 creado; `modules.md` y `mvp-scope.md` actualizados.

**Impacto en el código:** nuevo módulo `backend/src/modules/public/`, registrado en `app.module.ts`.

### 3. Cálculo de disponibilidad por intersección de fuentes

**Qué se decidió:** un slot es válido si `[t, t+duration)` cabe en el horario de la tienda (Branch), en el turno del barbero (Schedule), no toca el break, no se solapa con `AvailabilityBlock` ni con citas existentes. Slots pasados se marcan `past:true` (visibles pero bloqueados).

**Por qué:** cumple el requisito de "solo horarios disponibles" + "horarios pasados visibles pero bloqueados".

**Impacto en .docs:** ADR-012 §3.

**Impacto en el código:** `availability.service.ts`.

### 4. Slug auto-generado + editable

**Qué se decidió:** al crear una barbería, el slug se deriva del nombre (slugify); si colisiona, se añade sufijo único (`-2`, `-3`…). Campo opcional editable para sobrescribirlo. En edición, se valida contra duplicados.

**Por qué:** requisito del programador (slug desde el nombre, editable).

**Impacto en .docs:** ADR-012 §4.

**Impacto en el código:** `shared/utils/slugify.ts`, `tenant.service.ts`, `create-tenant.dto.ts`, `tenant-form-dialog.tsx`, `lib/slugify.ts`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `backend/src/database/migrations/1785888933801-AddScheduleBreak.ts` | Migración break en schedules | Break en Schedule (ADR-011) |
| `backend/src/modules/public/public.module.ts` | Módulo público | Endpoints públicos (ADR-012) |
| `backend/src/modules/public/controllers/public.controller.ts` | Rutas públicas | Endpoints públicos (ADR-012) |
| `backend/src/modules/public/services/public.service.ts` | Metadatos de la barbería | Endpoints públicos (ADR-012) |
| `backend/src/modules/public/services/availability.service.ts` | Cálculo de slots | Disponibilidad (ADR-012 §3) |
| `backend/src/modules/public/services/public-booking.service.ts` | Lookup + creación de cita | Endpoints públicos (ADR-012) |
| `backend/src/modules/public/dto/availability-query.dto.ts` | Validación query availability | Endpoints públicos |
| `backend/src/modules/public/dto/customer-lookup.dto.ts` | Validación lookup | Endpoints públicos |
| `backend/src/modules/public/dto/create-public-appointment.dto.ts` | Validación creación cita | Endpoints públicos |
| `backend/src/shared/utils/slugify.ts` | Utilidad slugify | Slug auto-generado |
| `frontend/src/lib/public-axios.ts` | Cliente axios sin JWT | Landing pública |
| `frontend/src/lib/slugify.ts` | Helper slugify frontend | Slug auto-generado |
| `frontend/src/types/public.ts` | Tipos de la landing | Landing pública |
| `frontend/src/services/public.service.ts` | Llamadas a API pública | Landing pública |
| `frontend/src/hooks/booking/use-public-data.ts` | Carga metadatos | Landing pública |
| `frontend/src/hooks/booking/use-availability.ts` | Carga slots | Landing pública |
| `frontend/src/hooks/booking/use-booking.ts` | Estado del wizard + autocompletado | Landing pública |
| `frontend/src/components/booking/BookingWizard.tsx` | Orquestador del wizard | Landing pública |
| `frontend/src/components/booking/steps/SelectService.tsx` | Paso servicio | Landing pública |
| `frontend/src/components/booking/steps/SelectBarber.tsx` | Paso barbero | Landing pública |
| `frontend/src/components/booking/steps/SelectDate.tsx` | Paso fecha/hora (slots bloqueados) | Landing pública |
| `frontend/src/components/booking/steps/Checkout.tsx` | Paso datos del cliente | Landing pública |
| `frontend/src/components/booking/steps/Success.tsx` | Paso confirmación | Landing pública |
| `frontend/src/app/[slug]/page.tsx` | Ruta dinámica de la landing | Landing pública |
| `.docs/decisions/ADR-011-break-horario-barbero.md` | Documentación break | Break en Schedule |
| `.docs/decisions/ADR-012-landing-publica-reservas.md` | Documentación landing | Endpoints públicos |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `backend/src/modules/schedule/entities/schedule.entity.ts` | Añadidos breakStartTime/breakEndTime | Break en Schedule (ADR-011) |
| `backend/src/modules/schedule/dto/create-schedule.dto.ts` | Campos break opcionales | Break en Schedule |
| `backend/src/modules/schedule/dto/update-schedule.dto.ts` | Campos break opcionales | Break en Schedule |
| `backend/src/modules/schedule/services/schedule.service.ts` | isBarberAvailable respeta break + validación | Break en Schedule |
| `backend/src/app.module.ts` | Registra PublicModule | Endpoints públicos |
| `backend/src/modules/tenants/services/tenant.service.ts` | Slug auto-generado + sufijo único | Slug auto-generado |
| `backend/src/modules/tenants/dto/create-tenant.dto.ts` | Slug opcional | Slug auto-generado |
| `frontend/src/middleware.ts` | Permite slugs públicos | Landing pública |
| `frontend/src/components/tenants/tenant-form-dialog.tsx` | Auto-genera slug desde nombre | Slug auto-generado |
| `.docs/architecture/modules.md` | Módulo público documentado | Documentación |
| `.docs/requirements/mvp-scope.md` | Landing + break en alcance | Documentación |
| `.docs/changelog/2026.md` | Entrada 2026-08-04 | Documentación |

### Archivos eliminados

Ninguno.

---

## Cambios en archivos clave

### `backend/src/modules/public/services/availability.service.ts`

**Antes:** no existía.
**Después:** genera slots cada 15 min intersectando horario de tienda, turno del barbero, break, AvailabilityBlock y citas existentes; marca slots pasados con `past:true`.
**Por qué es importante:** es el corazón del requisito de disponibilidad; cualquier cambio en horarios/break/citas debe mantener esta intersección.

### `backend/src/modules/public/services/public-booking.service.ts`

**Antes:** no existía.
**Después:** hace lookup de customer por email y crea la cita con upsert de Customer (si no existe, lo crea; si existe, actualiza nombre/teléfono). Recalcula disponibilidad antes de crear.
**Por qué es importante:** garantiza que el cliente se reutiliza por email y que no se reserva un slot ya tomado.

### `frontend/src/middleware.ts`

**Antes:** redirigía todo lo sin JWT a `/login`.
**Después:** deja pasar rutas públicas de slug (un solo segmento de nivel superior que no colisiona con login/register/admin/barber/super-admin). Los dashboards siguen protegidos.
**Por qué es importante:** sin este cambio, `/barberia-el-clasico` sería redirigido a `/login`. Es el punto más delicado de la auth.

### `frontend/src/app/[slug]/page.tsx`

**Antes:** no existía.
**Después:** Server Component que resuelve el slug (`await params`, Next 16), envuelto en Suspense, `force-dynamic`. Muestra "barbería no encontrada" sin redirigir a login.
**Por qué es importante:** es la entrada pública; debe respetar el patrón de params-Promise de Next 16.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Reserva: servicio → barbero → fecha/hora → datos → confirmación | Cumplido | Wizard 5 pasos; curl POST appointments 201 |
| Autocompletado por email | Cumplido | use-booking.ts debounce 400ms; curl lookup 200 |
| Solo horarios disponibles | Cumplido | availability.service intersecta 5 fuentes; curl verificado |
| Horarios pasados visibles pero bloqueados | Cumplido | past:true + SelectDate.tsx bloqueado |
| Respetar horario de tienda, barbero y break | Cumplido | Intersección + break verificado (slots 13-14 excluidos) |
| Staff sigue por / (login) | Cumplido | app/page.tsx redirect /login; dashboards protegidos |
| Slug auto-generado + editable | Cumplido | tenant.service + tenant-form-dialog |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | Doble reserva concurrente: chequeo solo a nivel app, sin lock/transacción | MEDIA | `public-booking.service.ts` | Antes de alto tráfico |
| 2 | Confirmación por email no se dispara (BullMQ disponible) | MEDIA | `public-booking.service.ts` | Antes de producción |
| 3 | Sin tests del nuevo código (availability, public-booking, public, break) | MEDIA | `backend/src/modules/public/`, `schedule` | Antes de producción |
| 4 | Colisión slug-reservado: backend permite slug `login`/`admin`/etc. | BAJA | `tenant.service.ts` | Baja |
| 5 | Lookup busca email en todas las branches del tenant, no solo la misma | BAJA | `public-booking.service.ts` | Baja |
| 6 | Zona horaria implícita entre servidor y navegador | BAJA | `availability.service.ts`, `use-booking.ts` | Baja |
| 7 | `middleware.ts` deprecado en Next 16 (migrar a `proxy.ts`) | BAJA | `frontend/src/middleware.ts` | Baja |

---

## Lo que el programador debe saber

- **La landing ya funciona end-to-end** contra el backend local: reserva, autocompletado por email, disponibilidad con break, slots pasados bloqueados, y doble reserva rechazada (422).
- **El break se modela con 2 campos en Schedule** (`breakStartTime`/`breakEndTime`). Para configurarlo, editar el horario del barbero en el dashboard admin.
- **El slug se auto-genera del nombre** al crear una barbería y es editable. La URL pública es `/barberia-el-clasico`.
- **El seed solo tiene schedule para un barbero un día** (María, lunes). Para probar la landing en otros días, hay que configurar schedules.
- **Pendientes antes de producción:** disparar la confirmación por email (BullMQ), añadir tests del nuevo código, y considerar lock para doble reserva.
- **Warning de deprecación** de `middleware.ts` en Next 16: se dejó sin renombrar para no arriesgar la auth; migrar a `proxy.ts` en un PR aparte.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-04_landing-publica_iter1.md` |