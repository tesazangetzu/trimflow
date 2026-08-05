# Guía de despliegue en producción

> **Referencia:** ADR-010 (decisión de arquitectura de despliegue)
> **Última actualización:** 2026-08-04

Esta guía documenta cómo está desplegado TrimFlow en producción y cómo reproducir/actualizar cada servicio.

## Arquitectura

```
Vercel (frontend)  →  Render (backend)  →  Neon (Postgres) + Upstash (Redis)
https://trimflow-mauve.vercel.app  →  https://trimflow-backend.onrender.com
```

- **Monorepo:** `tesazangetzu/trimflow` (rama `main`)
- Cada plataforma se conecta al mismo repo y despliega **solo su subdirectorio**.

## Servicios

| Servicio | URL | Plataforma | Root Directory |
|----------|-----|-----------|----------------|
| Frontend | `https://trimflow-mauve.vercel.app` | Vercel | `frontend` |
| Backend | `https://trimflow-backend.onrender.com` | Render | `backend` |
| API docs (Swagger) | `https://trimflow-backend.onrender.com/docs` | Render | — |
| Base de datos | (Neon console) | Neon | — |
| Redis | (Upstash console) | Upstash | — |

## 1. Backend (Render)

### Configuración del servicio

- **Runtime:** Node (build nativo)
- **Root Directory:** `backend`
- **Build Command:** `npm ci --include=dev && npm run build`
- **Start Command:** `node dist/main`
- **Node Version:** `20` (vía env var `NODE_VERSION`)

> ⚠️ **`--include=dev` es obligatorio.** Render con `NODE_ENV=production` omite devDependencies por defecto, y `@nestjs/cli` (binario `nest`) está en devDependencies. Sin `--include=dev`, el build falla con `nest: not found`.

### Variables de entorno

| Variable | Valor | Obligatoria |
|----------|-------|-------------|
| `NODE_ENV` | `production` | sí |
| `TZ` | `America/Lima` | **sí** |
| `PORT` | `3000` | sí |
| `API_PREFIX` | `v1` | sí |
| `DATABASE_URL` | URL de Neon | **sí** |
| `REDIS_URL` | URL de Upstash | **sí** |
| `JWT_SECRET` | secreto ≥32 chars | **sí** |
| `JWT_REFRESH_SECRET` | secreto ≥32 chars | **sí** |
| `JWT_EXPIRES_IN` | `15m` | no |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | no |
| `CORS_ORIGINS` | `https://trimflow-mauve.vercel.app` | sí |
| `LOG_LEVEL` | `info` | no |
| `TENANT_DB_SCHEMA_PREFIX` | `tenant_` | no |
| `RATE_LIMIT_TTL` | `60` | no |
| `RATE_LIMIT_MAX` | `100` | no |

> ⚠️ **`TZ=America/Lima` es obligatorio.** El backend calcula la disponibilidad y marca los slots pasados (`past`) usando la hora del servidor. Sin esta variable, el servidor corre en UTC y los horarios de la landing se desfasan respecto a la hora local de la barbería (Lima, UTC-5, sin horario de verano). En el contenedor Docker, además, la imagen `node:20-alpine` requiere `tzdata` instalado (ya añadido en el `Dockerfile`).

### Migraciones y seed

- Las **migraciones** corren automáticamente al arrancar (`migrationsRun: true`).
- El **seed** corre automáticamente solo si la tabla `users` está vacía.
- Para re-ejecutar el seed manualmente contra Neon:
  ```bash
  DATABASE_URL="<url-neon>" npm run seed:run
  ```

### Redeploy

1. Push a `main` en GitHub → Render detecta el cambio y redeploya automáticamente.
2. O manual: **Manual Deploy → Deploy latest commit**.

## 2. Frontend (Vercel)

### Configuración del proyecto

- **Root Directory:** `frontend`
- **Framework:** Next.js (auto-detectado)
- **Build Command:** `npm run build` (definido en `frontend/vercel.json`)

### Variables de entorno

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://trimflow-backend.onrender.com/v1` | **Debe incluir `/v1`** |

> ⚠️ El frontend usa `baseURL` tal cual (no agrega `/v1` automáticamente). Si falta el `/v1`, las llamadas a la API fallan con 404.

### Redeploy

- Push a `main` → Vercel redeploya automáticamente (solo si cambian archivos en `frontend/`).
- Cambios en variables de entorno requieren **rebuild** manual.

## 3. Base de datos (Neon)

- Servicio externo, no despliega código.
- Proporciona `DATABASE_URL` que se configura en Render.
- Las tablas se crean automáticamente vía migraciones al arrancar el backend.

## 4. Redis (Upstash)

- Servicio externo, no despliega código.
- Proporciona `REDIS_URL` que se configura en Render.
- Usado por BullMQ para colas de trabajo.

## Credenciales demo (seed)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Super Admin | `super@trimflow.com` | `super123` |
| Admin | `admin@trimflow.com` | `admin123` |
| Barber | `carlos@elclasico.com` | `barber123` |

## Troubleshooting

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Build falla `nest: not found` | Render omite devDependencies | Usar `npm ci --include=dev` |
| Login devuelve `relation "users" does not exist` | Migraciones no ejecutadas | Verificar `migrationsRun: true`; redeploy |
| Login devuelve `Invalid credentials` | Seed no ejecutado / credenciales incorrectas | Verificar seed automático; usar credenciales demo |
| API devuelve 404 en `/auth/login` | Falta prefijo `/v1` | Usar `/v1/auth/login` |
| Frontend no conecta al backend | `NEXT_PUBLIC_API_URL` sin `/v1` | Agregar `/v1` y rebuild en Vercel |
| CORS bloqueado | `CORS_ORIGINS` no incluye el origen | Configurar el origen exacto de Vercel |