# PROJECT CONTEXT

## Project Name

TrimFlow *(working name)*

---

# Vision

TrimFlow is a modern multi-tenant SaaS platform designed to help barber shops manage their daily operations efficiently.

The initial focus is appointment scheduling and customer management while maintaining a clean architecture that allows the platform to evolve into a complete business management system.

The platform must be simple, fast, reliable and scalable.

---

# Business Goals

The platform should allow barber shops to:

- Manage appointments.
- Manage barbers.
- Manage services.
- Manage customers.
- Send appointment notifications.
- View schedules.
- Manage business configuration.

Future versions will include:

- Online payments.
- Loyalty programs.
- Promotions.
- Mobile applications.
- Business analytics.
- Public API.
- AI-assisted scheduling.

---

# Product Philosophy

The system should prioritize:

- Simplicity.
- Performance.
- Reliability.
- Excellent user experience.
- Clean interfaces.
- Fast response times.
- Easy maintenance.
- Horizontal scalability.

Avoid unnecessary complexity.

Every new feature should justify its existence.

---

# Multi-Tenant Architecture

The platform is designed as a multi-tenant SaaS.

Each barber shop is completely isolated from the others.

Business data must never be accessible across tenants.

Every domain entity must belong to a Tenant.

Example hierarchy:

Tenant
└── Branches
    └── Barbers
        └── Appointments

---

# Primary Domain

Appointment scheduling is the core business domain.

Every architectural decision should protect the integrity of appointment scheduling.

The booking process must be:

- Fast.
- Consistent.
- Reliable.
- Concurrent-safe.

Double bookings must never occur.

---

# User Roles

## Super Administrator

Responsible for managing the SaaS platform.

Permissions include:

- Manage tenants.
- Activate or suspend tenants.
- Manage subscription plans.
- View platform analytics.
- Audit platform activity.
- Configure global settings.

---

## Administrator

Responsible for managing a single barber shop.

Permissions include:

- Manage employees.
- Manage services.
- Manage schedules.
- Manage appointments.
- Manage customers.
- Configure notifications.
- Configure business settings.
- View reports.

---

## Barber

Responsible for managing personal work.

Permissions include:

- View personal schedule.
- Manage assigned appointments.
- Mark appointments as completed.
- Block availability.
- View customer information.

---

# Appointment Workflow

Customer selects:

Service

↓

Barber

↓

Available date

↓

Available time

↓

Confirmation

↓

Appointment created

↓

Notification queue

↓

Email notification

↓

Optional WhatsApp notification

↓

Reminder notifications

The booking operation should finish quickly.

Notification delivery must never block appointment creation.

---

# Notifications

Notifications are asynchronous.

Supported channels:

- Email (required)
- WhatsApp (optional)

Future channels:

- SMS
- Push Notifications

Notifications should use queue-based processing.

---

# Payments

Initial version:

- Cash payment at the barber shop.

Future versions:

- Stripe
- Mercado Pago
- PayPal
- Other payment gateways

The payment system must use an abstraction layer.

Business logic must never depend directly on a payment provider.

---

# Dashboards

Three independent dashboards:

## Super Administrator Dashboard

Platform management.

## Administrator Dashboard

Business management.

## Barber Dashboard

Personal schedule management.

Each dashboard should expose only relevant information.

---

# Performance Goals

The platform should feel responsive.

Priority objectives:

- Fast page loads.
- Fast appointment creation.
- Efficient database queries.
- Minimal API latency.
- Efficient caching.
- Background processing for expensive tasks.

The user should never wait for notifications to be sent.

---

# Scalability Goals

The architecture should support:

- Thousands of tenants.
- Thousands of concurrent users.
- Multiple branches per tenant.
- Multiple barbers per branch.
- Large appointment history.

Avoid decisions that limit future growth.

---

# Security Goals

The platform must implement:

- Authentication.
- Role-based authorization (RBAC).
- Tenant isolation.
- Secure password storage.
- JWT authentication.
- Refresh Tokens.
- Audit logging.
- Input validation.
- Secure API design.

Security is mandatory.

---

# Technology Stack

## Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | 20 LTS (Iron) | Runtime |
| TypeScript | 5.4+ | Lenguaje |
| NestJS | 10.x | Framework backend |
| TypeORM | 0.3.x | ORM |
| PostgreSQL | 18 | Base de datos principal |
| Redis | 7.x | Cache / Colas |
| BullMQ | 5.x | Colas de trabajo |
| Winston | 3.x | Logging |
| Joi | 17.x | Validación de configuración |
| Jest | 29.x | Testing |
| Sentry | 8.x | Monitoreo de errores |

## Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | 20 LTS (Iron) | Runtime |
| TypeScript | 5.x | Lenguaje |
| Next.js | 16.2.x | Framework React |
| React | 19.x | UI Library |
| Tailwind CSS | 4.x | Estilos |
| shadcn/ui | latest | Componentes UI |
| lucide-react | latest | Iconos |
| recharts | latest | Charts de dashboards |
| Jest | 29.x | Testing |
| Testing Library | latest | Testing de componentes |

## Authentication

| Tecnología | Propósito |
|-----------|-----------|
| JWT (jsonwebtoken) | Access tokens |
| Refresh Tokens | Rotación de sesiones |
| RBAC | Control de acceso por rol |

---

# Architecture Guidelines

The project should follow:

- Modular Monolith architecture.
- Clean Architecture principles where appropriate.
- SOLID principles.
- Domain-oriented modules.
- Clear separation of concerns.
- High cohesion.
- Low coupling.

Modules should remain independent whenever possible.

---

# Coding Philosophy

Always prioritize:

1. Readability.
2. Simplicity.
3. Maintainability.
4. Performance.
5. Security.
6. Scalability.

Avoid premature optimization.

Avoid overengineering.

Prefer explicit code over clever code.

---

# Long-Term Vision

TrimFlow should evolve into a complete SaaS platform for appointment-based businesses.

The architecture should make it possible to support:

- Barber shops.
- Beauty salons.
- Spas.
- Tattoo studios.
- Massage centers.
- Wellness clinics.

without requiring a complete rewrite of the system.

Every architectural decision should consider long-term maintainability while keeping the MVP simple and focused.
