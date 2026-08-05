# Reporte de Ejecución — Landing pública de reservas (Iteración 1)

> **Fecha:** 2026-08-04
> **Objetivo:** Landing pública por slug + endpoints públicos de disponibilidad y reserva
> **Estado:** Implementación completa y verificada

---

## Resumen

Se implementó la landing pública de reservas por slug y los endpoints públicos del backend. El flujo completo fue verificado con curls contra el backend local (Postgres + Redis vía docker).

---

## Backend — Implementado

### Migración break
- `backend/src/database/migrations/1785888933801-AddScheduleBreak.ts`
- Añade `breakStartTime` y `breakEndTime` (TIME NULL) a `schedules`. No destructivo.

### Entidad Schedule
- `backend/src/modules/schedule/entities/schedule.entity.ts`
- Añadidos `breakStartTime?` y `breakEndTime?` (time without time zone, nullable).

### DTOs Schedule
- `create-schedule.dto.ts` y `update-schedule.dto.ts`: campos break opcionales con validación de formato HH:mm.

### ScheduleService
- `backend/src/modules/schedule/services/schedule.service.ts`
- `isBarberAvailable` ahora respeta el break (slot que toca [breakStart, breakEnd) → no disponible).
- Validación de reglas ADR-011 (ambos o ninguno; start<end; contenido en start/end) con `BusinessRuleViolation`.

### Módulo público (`backend/src/modules/public/`)
- `public.module.ts` — registra el módulo, reusa módulos de dominio, sin guards JWT.
- `controllers/public.controller.ts` — rutas `/v1/public/:slug`.
- `services/public.service.ts` — `getPublicShop(slug)` (metadatos no sensibles).
- `services/availability.service.ts` — generación de slots cada 15 min respetando tienda, barbero, break, bloques y citas; slots pasados marcados `past:true`.
- `services/public-booking.service.ts` — lookup de customer por email + creación de cita con upsert de Customer.
- `dto/availability-query.dto.ts`, `dto/customer-lookup.dto.ts`, `dto/create-public-appointment.dto.ts`.

### Registro
- `backend/src/app.module.ts` — `PublicModule` añadido a imports.

### Slug auto-generado + editable
- `backend/src/shared/utils/slugify.ts` — utilidad slugify.
- `backend/src/modules/tenants/services/tenant.service.ts` — slug derivado del nombre si no se envía; sufijo único en colisión; validación en update.
- `backend/src/modules/tenants/dto/create-tenant.dto.ts` — slug ahora opcional.

---

## Frontend — Implementado

### Proxy de auth
- `frontend/src/middleware.ts` — permite rutas públicas de slug (un solo segmento de nivel superior que no colisiona con login/register/admin/barber/super-admin). No se renombró a proxy.ts (decisión: evitar riesgo en auth; warning de deprecación documentado).

### Cliente público + types + service
- `frontend/src/lib/public-axios.ts` — instancia axios sin interceptor JWT/refresh.
- `frontend/src/types/public.ts` — tipos de la landing.
- `frontend/src/services/public.service.ts` — getShop, getAvailability, lookupCustomer, createAppointment.

### Hooks
- `frontend/src/hooks/booking/use-public-data.ts` — carga metadatos de la barbería.
- `frontend/src/hooks/booking/use-availability.ts` — carga slots con AbortController.
- `frontend/src/hooks/booking/use-booking.ts` — estado del wizard, autocompletado por email (debounce 400ms), submit.

### Wizard
- `frontend/src/components/booking/BookingWizard.tsx` — orquestador multi-paso (creado por el Orquestador).
- `frontend/src/components/booking/steps/` — SelectService, SelectBarber, SelectDate, Checkout, Success.
- Slots pasados bloqueados (disabled/opacity/line-through, sin onClick).

### Ruta dinámica
- `frontend/src/app/[slug]/page.tsx` — Server Component, `await params` (Next 16), Suspense, `dynamic = "force-dynamic"`. Estado "barbería no encontrada" sin redirigir a login.

### Formulario tenant (slug auto-generado)
- `frontend/src/lib/slugify.ts` — helper slugify.
- `frontend/src/components/tenants/tenant-form-dialog.tsx` — auto-genera slug desde el nombre en modo crear (si el usuario no lo editó manualmente); campo editable.

---

## Verificación

### Builds
- Backend: `npm run build` → OK (nest build sin errores).
- Frontend: `npm run build` → OK (ruta `/[slug]` dinámica generada).
- Tests backend: `npm test` → 9 suites, 80 tests, todos PASS.

### Curls (backend local)
| Endpoint | Resultado |
|----------|-----------|
| `GET /v1/public/barberia-el-clasico` | 200, metadatos con branches/services/barbers |
| `GET /availability?serviceId&barberId&date` | 200, slots cada 15 min |
| Break 13:00-14:00 | Slots excluidos correctamente |
| `POST /customers/lookup` (email nuevo) | 404 |
| `POST /customers/lookup` (email existente) | 200, datos del cliente |
| `POST /appointments` | 201, crea cita + customer |
| Slot reservado | Ya no aparece en availability |
| Doble reserva mismo slot | 422 BusinessRuleViolation |

### Limpieza
- Se revirtió el break de prueba y se eliminaron la cita y el customer de prueba.

---

## Decisiones tomadas
- **Doble reserva concurrente:** se acepta chequeo a nivel app para MVP (riesgo de carrera documentado; sin lock DB).
- **middleware.ts → proxy.ts:** no se renombró en este PR (evitar riesgo en auth). Warning de deprecación pendiente.
- **Paso de slots:** 15 min. **Ventana:** 7 días.
- **Notificaciones email:** NO se disparan en este PR (módulo notifications/BullMQ existe; queda como ticket).
- **Validación del break:** en el servicio con `BusinessRuleViolation`.

## Pendientes / deuda técnica
- Migrar `middleware.ts` → `proxy.ts` (Next 16 deprecación).
- Notificaciones email de confirmación (BullMQ).
- Lock DB para doble reserva concurrente (opcional MVP).
- El seed solo tiene schedule para un barbero un día; ampliar schedules de demo.