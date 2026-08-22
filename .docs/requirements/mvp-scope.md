# MVP Scope — TrimFlow v1.0

## Filosofía del MVP

El MVP debe ser **funcional, estable y value-focused**. Solo incluye lo mínimo indispensable para que una barbería real pueda operar. Las funcionalidades post-MVP se documentan pero no se implementan hasta que estén validadas con usuarios reales.

---

## Incluido en el MVP

### Roles y autenticación

- [x] Registro y login con email/contraseña (JWT + Refresh Tokens).
- [x] Roles: Super Admin, Administrator (dueño de barbería), Barber.
- [x] RBAC básico por rol.

### Multi-tenancy

- [x] Aislamiento de datos por tenant (cada barbería es un tenant).
- [x] Super Admin puede crear/activar/suspender tenants.
- [x] Jerarquía: Tenant → Branches → Barbers → Appointments.

### Gestión de sucursales (Administrator)

- [x] CRUD de sucursales (mínimo 1 por tenant, soporte para múltiples).
- [x] Configurar horarios de atención por sucursal.

### Gestión de barbers (Administrator)

- [x] CRUD de barbers asociados a sucursales.
- [x] Asignar horarios/bloques de trabajo a barbers.
- [x] Máximo 1 registro de horario por día de la semana y por barbero (7 días = máx 7 registros, ver ADR-018). Crear un día ya registrado lanza error de regla de negocio; editar actualiza el registro existente.

### Gestión de servicios (Administrator)

- [x] CRUD de servicios ofrecidos (nombre, duración, precio).
- [x] Asignar servicios a sucursales.

### Agendamiento de citas (CORE)

- [x] Cliente selecciona: servicio → barber → fecha → hora.
- [x] Validación de disponibilidad en tiempo real.
- [x] Prevención de doble reserva (concurrent-safe).
- [x] Administrador puede crear/modificar/cancelar citas.
- [x] Barber puede ver su agenda y marcar citas como completadas.
- [x] Barber puede bloquear slots de disponibilidad.

### Break del barbero (ver ADR-011)

- [x] Break de un solo bloque por día sobre el horario del barbero (`Schedule.breakStartTime`/`breakEndTime`).
- [x] El break se respeta en el cálculo de disponibilidad (público y admin).

### Landing pública de reservas (ver ADR-012)

- [x] Self-service por slug: `GET /v1/public/:slug` (metadatos de la barbería).
- [x] Cálculo de disponibilidad pública: `GET /v1/public/:slug/availability`.
- [x] Lookup de cliente por email: `POST /v1/public/:slug/customers/lookup` (autocompletar).
- [x] Creación de reserva sin registro: `POST /v1/public/:slug/appointments`.
- [x] Flujo frontend en 4 pasos: servicio → barbero → fecha/hora → datos del cliente → confirmación.
- [x] Sólo se muestran horarios disponibles; los pasados aparecen bloqueados (no seleccionables).
- [x] Email obligatorio del cliente (confirmación por email; sin WhatsApp/SMS en MVP).
- [x] Slug auto-generado del nombre (slugify) con sufijo único en colisión y campo editable opcional (requisito admin).

### Personalización de la landing pública por tenant (ver ADR-013)

- [x] Config por tenant persistida en `Tenant.settings.landing` (JSONB), fusionada sobre `LANDING_DEFAULTS` (merge defensivo).
- [x] Endpoints `/v1/landing` GET/PUT protegidos (JWT + RBAC, rol admin), escopados por `tenantId` del token.
- [x] Panel admin `/admin/landing`: edición de presentación, marca/imágenes, paleta, tipografía y secciones visibles.
- [x] Acciones "Restaurar default" y "Ver mi landing" en el panel.
- [x] La personalización aplica SOLO a la landing pública `/[slug]` (aislamiento por CSS variables); los dashboards conservan su tema.
- [x] `PublicShop.landing` inyecta la config en el payload de `/v1/public/:slug`.
- [x] La identidad visual por defecto es dark luxury (ADR-015): paleta dark dorada sobre los **mismos 6 tokens `--landing-*`**, fuentes Marcellus / Spectral / IBM Plex Mono (IBM Plex como utility), barber-pole→hilo/motivo dorado; la personalización del tenant sigue aislada por CSS variables de scope local.
- [x] Se preparan Galería/Stats como capas frontend condicionales en la landing (ocultas por defecto; sin inventar datos ni imágenes).

### Notificaciones (asíncronas)

- [x] Confirmación por email al crear cita.
- [x] Recordatorio por email (24h antes).
- [x] Procesamiento mediante BullMQ (no bloquear creación de cita).

### Dashboard de barber

- [x] Ver agenda del día.
- [x] Ver citas pendientes, completadas, canceladas.
- [x] Marcar cita como completada.

### Nombre del tenant en el dashboard (ver ADR-017)

- [x] Endpoint self-service `GET /v1/tenants/me` escopado por `tenantId` del token (roles admin/barber), devuelve `{ id, name }`.
- [x] Hook frontend `useTenantName` con refetch en mount y focus (visibility/focus), sin petición si no hay `tenantId`.
- [x] Sidebar de `DashboardShell` muestra el nombre del tenant bajo el brand label, con Skeleton mientras carga y oculto ante error.

### Dashboard de administrador

- [x] Visión general del negocio (citas hoy, barbers activos).
- [x] Gestión completa de sucursales, barbers, servicios, citas.

### Dashboard de Super Admin

- [x] Lista de tenants con estado (activo/suspendido).
- [x] Crear y gestionar tenants.

### Pago

- [x] Pago en efectivo (sin integración con gateway).
- [x] Registro de pago al marcar cita como completada.

---

## Excluido del MVP (Post-MVP v1.1+)

### v1.1 — Notificaciones mejoradas

- [ ] Notificaciones WhatsApp.
- [ ] Recordatorio vía SMS.
- [ ] Personalización de plantillas de notificación.

### v1.2 — Gestión de clientes mejorada

- [ ] Historial completo de cliente.
- [ ] Notas y preferencias por cliente.
- [ ] Programa de fidelidad básico.

### v2.0 — Pagos online

- [ ] Integración con Stripe.
- [ ] Integración con Mercado Pago.
- [ ] Pasarela de pagos abstracta.
- [ ] Facturación y recibos.

### v2.1 — Analítica

- [ ] Reportes de ingresos.
- [ ] Reportes de citas (ocupación por barber, servicio más vendido).
- [ ] Dashboard de métricas.

### v2.2 — Self-service para clientes

> Nota: el **portal público para agendar citas** se adelanta al MVP (landing pública, ver ADR-012). Lo que sigue **excluido** aquí:
- [ ] Cancelación/modificación de la cita por parte del cliente.
- [ ] Recordatorios configurables por el cliente.

### v3.0 — Funcionalidades avanzadas

- [ ] Programas de lealtad y promociones.
- [ ] Multi-idioma.
- [ ] Multi-moneda.
- [ ] Aplicaciones móviles (React Native).

### v4.0 — Expansión vertical

- [ ] Soporte para salones de belleza.
- [ ] Soporte para spas.
- [ ] Soporte para centros de bienestar.
- [ ] API pública.

---

## Backlog — Próximas actualizaciones

> Notas de mejora registradas por el programador para futuras iteraciones. No forman parte del MVP actual.

### Gestión por sucursal en el panel admin

- [ ] **Servicios por sucursal**: en el panel admin, gestionar los servicios dentro de una sucursal seleccionada (el modelo ya tiene `Service.branchId`; falta la UX de gestión por sucursal).
- [ ] **Horarios por sucursal**: gestionar los horarios/bloques de trabajo por sucursal (hoy `Schedule`/`AvailabilityBlock` cuelgan de `barberId`; el barber ya tiene `branchId`).
- [ ] **Clientes por sucursal**: gestionar los clientes por sucursal (el modelo ya tiene `Customer.branchId`; falta la UX de gestión por sucursal).
- [ ] **Barberos por sucursal**: gestionar los barberos por sucursal (el modelo ya tiene `Barber.branchId`; falta la UX de gestión por sucursal).

### Upload de imágenes en el panel admin landing (frontend) — ✅ COMPLETADO (2026-08-21, commit `407821a`)

- [x] Reemplazado el input de URL del card "Marca e imágenes" (`/admin/landing`) por un **dropzone** (`ImageDropzone`) que sube la imagen al endpoint R2 (`POST /landing/branding/upload?target=`) y guarda la ruta devuelta en `branding.logoUrl` / `branding.heroImageUrl`.
- [x] Validación en el cliente de tipos de archivo (png, jpg, webp) y proporciones antes de subir.
- [x] Vista previa de la imagen subida con opción de reemplazo/eliminación.

---

## Criterios de calidad del MVP

| Criterio | Objetivo |
|----------|----------|
| Tiempo de creación de cita | < 2 segundos |
| Disponibilidad (uptime) | 99.5% |
| Tiempo de respuesta API (p95) | < 500ms |
| Pruebas unitarias + integración | > 80% cobertura |
| Sin doble reserva | 100% garantizado |
| Despliegue | Un solo comando (`docker compose up`) |
| Documentación de API | Endpoints documentados |
| Onboarding de nuevo tenant | < 5 minutos |
