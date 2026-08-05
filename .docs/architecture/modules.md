# Organización de Módulos del Backend (Monolito Modular)

## Principios

- **Módulos por dominio de negocio**, no por capa técnica.
- Cada módulo es un microservicio potencial: alta cohesión interna, bajo acoplamiento externo.
- Comunicación entre módulos: solo vía **servicios publicados** (interfaces explícitas), nunca acceso directo a repositorios de otros módulos.
- Cada módulo tiene su propia carpeta de entidades, servicios, controladores y pruebas.

## Módulos del Backend

```
src/
├── main.ts
├── app.module.ts
│
├── config/                         # Configuración global (env vars, validation schema)
│   ├── configuration.ts
│   ├── validation.schema.ts
│   └── env.d.ts
│
├── database/                       # DataSource y migraciones globales
│   ├── data-source.ts
│   ├── migrations/
│   └── seeds/
│
├── shared/                         # Código compartido entre módulos
│   ├── filters/                    # Filtros de excepción globales
│   ├── guards/                     # Guards de autenticación y RBAC
│   ├── interceptors/               # Interceptors (logging, request-id, transform)
│   ├── pipes/                      # Pipes de validación globales
│   ├── decorators/                 # Decoradores personalizados (@CurrentUser, @Tenant)
│   ├── logger/                     # Logger configurado (Winston)
│   ├── interfaces/                 # Interfaces base (BaseEntity, Timestampable)
│   └── utils/                      # Utilidades genéricas
│
├── modules/
│   ├── tenants/                    # Gestión de tenants (Super Admin)
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── tenants.module.ts
│   │
│   ├── branches/                   # Sucursales de un tenant
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── branches.module.ts
│   │
│   ├── barbers/                    # Barbers asociados a sucursales
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── barbers.module.ts
│   │
│   ├── services/                   # Servicios ofrecidos (cortes, tintes, etc.)
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── services.module.ts
│   │
│   ├── customers/                  # Clientes registrados
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── customers.module.ts
│   │
│   ├── appointments/               # Módulo CORE — Agendamiento de citas
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── appointments.module.ts
│   │
│   ├── notifications/              # Gestión de notificaciones (email, WhatsApp)
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   ├── mail/                   # Adaptadores de email
│   │   ├── whatsapp/               # Adaptadores de WhatsApp
│   │   ├── jobs/                   # Procesadores de BullMQ
│   │   └── notifications.module.ts
│   │
│   ├── auth/                       # Autenticación y autorización
│   │   ├── __tests__/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── strategies/            # Estrategias JWT, Refresh Token
│   │   ├── guards/                # Guards específicos de auth
│   │   └── auth.module.ts
│   │
│   ├── schedule/                   # Horarios de barberos + bloques de disponibilidad
│   │   ├── __tests__/
│   │   ├── entities/               # Schedule, AvailabilityBlock (ver ADR-011: break en Schedule)
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── schedule.module.ts
│   │
│   ├── public/                     # Landing pública de reservas — self-service SIN JWT
│   │   │                           #   (ver ADR-012: /v1/public/:slug + cálculos de disponibilidad)
│   │   ├── __tests__/
│   │   ├── services/               # Consulta pública de barbería, disponibilidad, creación de reservas
│   │   ├── controllers/            # /v1/public/:slug/... (exento de guards JWT)
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── public.module.ts
│   │
│   └── settings/                   # Configuración del negocio
│       ├── __tests__/
│       ├── entities/
│       ├── services/
│       ├── controllers/
│       ├── dto/
│       ├── interfaces/
│       └── settings.module.ts
```

## Dependencias entre módulos

Cada módulo importa explícitamente solo lo que necesita de otros módulos a través de NestJS modules.

```
tenants ──→ branches ──→ barbers ──→ appointments
                                       ├── customers
                                       ├── services
                                       ├── notifications (vía BullMQ)
                                       └── auth

auth ──→ shared/
notifications ──→ shared/
settings ──→ branches
public ──→ tenants (slug) ──→ branches ──→ barbers / services / schedule / customers / appointments
```

### Reglas de dependencia

1. **Nunca** A → B → A (no ciclos).
2. **Nunca** importar repositorios de otro módulo directamente.
3. **Siempre** publicar una interfaz si otro módulo necesita acceder a funcionalidad.
4. **Jamás** un módulo de dominio debe depender de un módulo de infraestructura (ej. notifications).

## Módulo público de reservas (`public`)

El módulo `public` expone la **landing pública por barbería** sin autenticación (ver **ADR-012**). No usa guards JWT: resuelve la barbería únicamente por el **slug** de la URL y opera de forma acotada a esa branch.

### Contratos HTTP (`/v1/public/:slug`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/v1/public/:slug` | Metadatos públicos de la barbería (nombre, branch, servicios, barberos). |
| GET | `/v1/public/:slug/availability` | Cálculo de disponibilidad real (query: serviceId, barberId?, fecha). |
| POST | `/v1/public/:slug/customers/lookup` | Autocompleta un `Customer` existente de la branch por email (o 404). |
| POST | `/v1/public/:slug/appointments` | Crea la reserva (upsert de Customer + creación de Appointment). |

### Flujo de reserva (frontend Next.js)

`servicio → barbero → fecha/hora → datos del cliente → confirmación`.

En el paso de datos, al escribir el email se hace el **lookup** público para autocompletar; si no existe, el backend crea el `Customer` (misma branch) al hacer POST de la cita. Email OBLIGATORIO (confirmación por email; sin WhatsApp/SMS en MVP).

### Cálculo de disponibilidad

Los slots válidos resultan de la intersección de: horario de tienda (`Branch.openingTime/closingTime`), horario del barbero (`Schedule.startTime/endTime` si `isActive`), **break del barbero** (`Schedule.breakStartTime/breakEndTime`, ver **ADR-011**), bloqueos puntuales (`AvailabilityBlock`) y citas existentes (`Appointment`). Se descarta cualquier slot que no quepa completo por `Service.durationMinutes`. Los slots **pasados** se muestran pero **bloqueados** (no seleccionables).

## Clean Architecture dentro de cada módulo

```
módulo/
  entities/     ← Capa de dominio (entidades con reglas de negocio)
  services/     ← Casos de uso / aplicación
  interfaces/   ← Contratos (repositorios, servicios externos)
  controllers/  ← Adaptadores de entrada (HTTP)
  dto/          ← Objetos de transferencia
  __tests__/    ← Pruebas
```

## Frontend (paralelo estructural)

```
src/
  app/                    # Páginas (Next.js App Router)
  components/             # Componentes React compartidos
    ui/                   # shadcn/ui components
    forms/                # Formularios reutilizables
    layouts/              # Layouts por rol (admin, barber, super-admin)
  lib/                    # Utilidades compartidas
  services/               # Clientes API (por módulo)
  hooks/                  # Custom hooks
  types/                  # Tipos TypeScript compartidos
  __tests__/              # Pruebas
```
