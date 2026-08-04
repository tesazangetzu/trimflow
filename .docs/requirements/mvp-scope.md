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

### Notificaciones (asíncronas)

- [x] Confirmación por email al crear cita.
- [x] Recordatorio por email (24h antes).
- [x] Procesamiento mediante BullMQ (no bloquear creación de cita).

### Dashboard de barber

- [x] Ver agenda del día.
- [x] Ver citas pendientes, completadas, canceladas.
- [x] Marcar cita como completada.

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

- [ ] Portal web público para agendar citas.
- [ ] Cancelación/modificación por parte del cliente.
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
