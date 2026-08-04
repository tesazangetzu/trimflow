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
```

### Reglas de dependencia

1. **Nunca** A → B → A (no ciclos).
2. **Nunca** importar repositorios de otro módulo directamente.
3. **Siempre** publicar una interfaz si otro módulo necesita acceder a funcionalidad.
4. **Jamás** un módulo de dominio debe depender de un módulo de infraestructura (ej. notifications).

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
