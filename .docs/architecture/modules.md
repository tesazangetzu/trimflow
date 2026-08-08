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
│   ├── landing/                      # Personalización de la landing pública por tenant
│   │   │                             #   (ver ADR-013: config en Tenant.settings.landing JSONB)
│   │   ├── __tests__/
│   │   ├── services/                 # Persistencia en Tenant.settings.landing + merge sobre defaults
│   │   ├── controllers/              # /v1/landing GET/PUT (protegidos JWT + RBAC admin)
│   │   ├── dto/                      # UpdateLandingConfigDto (parcial, class-validator)
│   │   ├── interfaces/
│   │   └── landing.module.ts
│   │   └── landing-config.ts         # Interfaces + LANDING_DEFAULTS + mergeLandingConfig
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
public ──→ landing (mergeLandingConfig / config pública) (ver ADR-013)
landing ──→ tenants (settings JSONB) / shared (guards, decorators, excepciones, logger)
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

## Módulo de personalización de la landing (`landing`)

El módulo `landing` expone la **configuración de la landing pública por tenant** (ver **ADR-013**). A diferencia de `public`, este módulo SÍ usa guards JWT: solo un **Administrador** autenticado puede leer/editar la config de su propio tenant. El alcance se resuelve por el `tenantId` del `@CurrentUser` del token (aislamiento multi-tenant), nunca desde el body ni la URL.

### Contratos HTTP (`/v1/landing`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/v1/landing` | Config completa de la landing del tenant (`{ slug, config }`): defaults fusionados con lo guardado. |
| PUT | `/v1/landing` | Actualización PARCIAL de la config (DTO `UpdateLandingConfigDto` con class-validator). Devuelve la config completa resultante. |

### Persistencia y consumo

- La config se guarda en `Tenant.settings.landing` (JSONB) y se **fusiona sobre `LANDING_DEFAULTS`** mediante `mergeLandingConfig` (merge profundo defensivo; siempre devuelve un `LandingConfig` completo y válido). No requiere migración de DB.
- El consumo público se inyecta en el payload `PublicShop.landing` (`/v1/public/:slug`).
- La config aplica **SOLO** a la landing pública `/[slug]`; los dashboards conservan su tema (aislamiento por CSS variables de scope local en `landing-theme.ts`).

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
    (dashboard)/admin/landing/   # Panel de personalización de la landing pública (ver ADR-013)
    [slug]/              # Landing pública por slug — identidad dark luxury (ver ADR-012/015)
    [slug]/reservar/     # Vista de reserva separada (BookingWizard reutilizado), ver ADR-014
  components/             # Componentes React compartidos
    ui/                   # shadcn/ui components
    forms/                # Formularios reutilizables
    layouts/              # Layouts por rol (admin, barber, super-admin) + nav-config
    landing/              # Componentes de la landing pública (ver ADR-012/013/014/015)
      LandingPage.tsx     #   Orquestador: Hero + secciones + CTA + Footer (incluye Gallery/Stats capas)
      LandingHero.tsx     #   Hero dark: banda oscura + scrim/imagen + doble CTA + scroll indicator + marquesina
      LandingSections.tsx #   Secciones dark (Servicios/Equipo/Galería/Stats/Horarios/Ubicación) + strop dorado
      LandingNav.tsx      #   Nav transparente→oscuro al scroll + anchors + CTA + hamburguesa (mobile)
      LandingCTA.tsx      #   CTA band "Reservar" (sweep + motivo dorado)
      LandingFooter.tsx   #   Footer dinámico (nombre del shop + TrimFlow), extraído de LandingPage
      LandingGallery.tsx  #   Galería grid/masonry (capa preparada: oculta hasta que exista config de imágenes)
      LandingStats.tsx    #   Stats (capa preparada: oculta hasta que existan cifras configurables)
      LandingState.tsx    #   Estados loading/notFound/error
      Reveal.tsx          #   Scroll reveal (IntersectionObserver + prefers-reduced-motion)
      landing-theme.ts    #   landingThemeVars: paleta dark luxury sobre los 6 tokens --landing-* (ADR-013/015)
    booking/              # BookingWizard + ReservationPage (flujo de reserva pública) + WIZARD_TOKENS scoped
  lib/                    # Utilidades compartidas
  services/               # Clientes API (por módulo): landing.service.ts, etc.
  hooks/                  # Custom hooks
  types/                  # Tipos TypeScript compartidos (landing.ts, public.ts)
  __tests__/              # Pruebas
```
