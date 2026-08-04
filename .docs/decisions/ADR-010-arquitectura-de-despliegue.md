# ADR-010: Arquitectura de despliegue en producción (Vercel + Render + Neon + Upstash)

**Estado:** ACEPTADO
**Fecha:** 2026-08-04

**Contexto:**
TrimFlow es un monorepo con `backend/` (NestJS) y `frontend/` (Next.js). Se requiere desplegar el stack en producción con servicios independientes por capa. El stack de producción elegido es:

- **Frontend:** Vercel (Next.js 16, App Router)
- **Backend:** Render (NestJS, Node 20)
- **Base de datos:** Neon (PostgreSQL serverless)
- **Redis / colas:** Upstash (BullMQ)

Cada plataforma se conecta al mismo repositorio monorepo (`tesazangetzu/trimflow`) y despliega **solo su subdirectorio** (Root Directory), de modo que los deploys son independientes entre sí.

## Decisión

Desplegar cada capa en su plataforma especializada, conectando todas al mismo monorepo:

| Capa | Plataforma | Root Directory | Build/Start |
|------|-----------|----------------|-------------|
| Frontend | Vercel | `frontend` | `npm run build` (Next.js) |
| Backend | Render | `backend` | `npm ci --include=dev && npm run build` / `node dist/main` |
| Base de datos | Neon | — (servicio externo) | — |
| Redis | Upstash | — (servicio externo) | — |

### Configuración de Render (`render.yaml`)

- `runtime: node` (build nativo, más robusto que Docker para monorepos).
- `buildCommand: npm ci --include=dev && npm run build` — **`--include=dev` es obligatorio** porque `@nestjs/cli` (binario `nest`) vive en devDependencies y Render con `NODE_ENV=production` los omite por defecto.
- `startCommand: node dist/main`.
- `NODE_VERSION: "20"` — el proyecto está construido para Node 20 (Render usa Node 24 por defecto).

### Configuración de Vercel (`frontend/vercel.json`)

- `framework: nextjs`, `buildCommand: npm run build`, `outputDirectory: .next`.

## Consecuencias

### Variables de entorno por servicio

**Backend (Render):**

| Variable | Valor | Notas |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | |
| `API_PREFIX` | `v1` | Prefijo global de la API |
| `DATABASE_URL` | URL de Neon | Obligatoria (validación Joi) |
| `REDIS_URL` | URL de Upstash | Obligatoria (validación Joi) |
| `JWT_SECRET` | secreto ≥32 chars | Obligatoria |
| `JWT_REFRESH_SECRET` | secreto ≥32 chars | Obligatoria |
| `JWT_EXPIRES_IN` | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | |
| `CORS_ORIGINS` | URL del frontend en Vercel | Debe incluir el origen exacto |
| `LOG_LEVEL` | `info` | |
| `TENANT_DB_SCHEMA_PREFIX` | `tenant_` | |
| `RATE_LIMIT_TTL` / `RATE_LIMIT_MAX` | `60` / `100` | |

**Frontend (Vercel):**

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://trimflow-backend.onrender.com/v1` | **Debe incluir `/v1`** — el frontend usa `baseURL` tal cual |

### Migraciones y seed automáticos

- Las **migraciones** se ejecutan automáticamente al arrancar el backend (`migrationsRun: true` en `TypeOrmModule`).
- El **seed** de datos demo se ejecuta automáticamente **solo si la tabla `users` está vacía** (ver `main.ts`).
- Credenciales demo: `super@trimflow.com`/`super123`, `admin@trimflow.com`/`admin123`, `carlos@elclasico.com`/`barber123`.

### Prefijo de API

El backend usa `app.setGlobalPrefix('v1')`. Todas las rutas de la API están bajo `/v1` (ej: `/v1/auth/login`). El frontend debe apuntar a `.../v1`.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Render con `runtime: docker`** | Problemas de contexto de build en monorepos; el `COPY . .` del Dockerfile no resolvía bien el contexto. Se usa build nativo de Node. |
| **Un solo servicio que aloje frontend + backend** | Rompe la independencia de deploys y el escalado por capa. |
| **Base de datos en Render** | Se prefiere Neon (serverless, sin servidor dedicado). |

## Impacto en .docs

- `architecture/deployment.md`: guía detallada de despliegue (este ADR es la decisión; la guía es el procedimiento).
- `changelog/2026.md`: entrada con fecha y referencia a esta ADR.