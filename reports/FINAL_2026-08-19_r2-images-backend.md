# Reporte Técnico Final
## Backend de imágenes con Cloudflare R2 (módulo + servicio + multer + env)

> **Generado:** 2026-08-19
> **Proyecto:** TrimFlow
> **Stack:** NestJS 10 · TypeScript · PostgreSQL/TypeORM · Cloudflare R2 (AWS SDK S3) · Multer · Sharp
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

Implementar el backend de manejo de imágenes con Cloudflare R2: un módulo `images` que suba imágenes al bucket R2 y devuelva una ruta pública, un servicio de conexión con R2 (`r2-storage`), las variables de env para las llaves, y el uso de Multer donde se necesita (endpoint de branding en el landing — subir logo/hero en png/jpg/webp manteniendo proporciones), persistiendo la ruta devuelta en las tablas/config necesarias.

**Éxito cuando:**
- Módulo `backend/src/modules/images` completo (controller, services R2 + validator, DTOs, interfaces, constantes, tests).
- Variables R2 en `.env.example` y validadas en `validation.schema.ts`.
- Endpoint `POST /v1/landing/branding/upload` con Multer, limitando a png/jpg/webp y tamaño máx, que sube a R2 y persiste la URL en `Tenant.settings.landing.branding.logoUrl`/`heroImageUrl`.
- Compilación y tests backend en verde.
- `.docs` actualizado (mvp-scope ya refleja el backend R2; frontend queda en backlog).

**Fuera de alcance:** Frontend/uploader en `/admin/landing` (iteración posterior), lógica de negocio de reservas, otros módulos.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | Ninguna (solo observaciones BAJA no bloqueantes) |

---

## Decisiones técnicas tomadas

### Cloudflare R2 vía AWS SDK S3 (endpoint compatible)

**Qué se decidió:**
Usar `@aws-sdk/client-s3` con `endpoint: https://<accountId>.r2.cloudflarestorage.com` y `region: 'auto'` para subir objetos al bucket R2.

**Por qué se tomó esta decisión:**
R2 es compatible con la API S3; el SDK oficial de AWS es la vía más mantenible y documentada, sin dependencias propietarias.

**Alternativas descartadas:**
- SDK propietario de Cloudflare (no existe SDK R2 oficial para Node; se usa S3-compatible).
- `aws-sdk` v2 (legacy, sin soporte activo).

**Impacto en .docs:**
Recomendado registrar ADR nuevo (documental, pendiente).

**Impacto en el código:**
`r2-storage.service.ts` — cliente S3 con credenciales de env, `PutObjectCommand`, destroy en shutdown.

### Validación y redimensionado con Sharp (proporciones por target)

**Qué se decidió:**
`ImageValidatorService` valida MIME + extensión, re-verifica el formato real con `sharp` (anti-spoofing), valida la proporción objetivo (±10%) y redimensiona `fit: 'inside'` si excede el máximo por target (logo 1:1 max 512px; hero 16:9 max 1920×1080).

**Por qué se tomó esta decisión:**
El usuario pidió subir png/jpg/webp "manteniendo las proporciones". Sharp permite validar el contenido real (no solo el MIME declarado) y normalizar dimensiones antes de subir a R2.

**Alternativas descartadas:**
- Confiar solo en el `fileFilter` de Multer (no detecta spoofing ni valida proporciones).
- No redimensionar (imágenes gigantes encarecen almacenamiento y rompen la UI).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`image-validator.service.ts`, `constants/image-policy.ts`.

### Persistencia de la URL en `Tenant.settings.landing.branding`

**Qué se decidió:**
`LandingService.setBrandingImageUrl(tenantId, field, url)` persiste la URL devuelta por R2 en `Tenant.settings.landing.branding.logoUrl`/`heroImageUrl` sin tocar el resto de la config (merge defensivo, consistente con ADR-013).

**Por qué se tomó esta decisión:**
El usuario pidió que la ruta devuelta por R2 "se registre en las tablas necesarias". La config de landing ya vive en `Tenant.settings.landing` (JSONB) según ADR-013; se reutiliza ese mecanismo.

**Alternativas descartadas:**
- Tabla nueva de imágenes (sobre-ingeniería para el MVP; el modelo JSONB ya cubre branding).

**Impacto en .docs:**
Ninguno (refuerza ADR-013).

**Impacto en el código:**
`landing.service.ts` (nuevo método), `landing.controller.ts` (nuevo endpoint).

### Multer en los dos puntos de subida

**Qué se decidió:**
`FileInterceptor` (memoryStorage) en `POST /images/upload` (genérico) y `POST /landing/branding/upload` (persiste en branding), con `limits.fileSize = 10MB` y `fileFilter` de MIME.

**Por qué se tomó esta decisión:**
El usuario pidió "comprobar en dónde vamos a necesitar el multer para registrar las imágenes, por ejemplo en el landing". Se aplicó en el módulo genérico y en el flujo de branding que persiste la URL.

**Alternativas descartadas:**
- DiskStorage (no necesario; el buffer se procesa con sharp en memoria).

**Impacto en .docs:**
Ninguno.

**Impacto en el código:**
`images.controller.ts`, `landing.controller.ts`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `backend/src/modules/images/images.module.ts` | Módulo NestJS con DI por tokens | R2 vía AWS SDK S3 |
| `backend/src/modules/images/constants/image-policy.ts` | Targets, MIME, tamaño, proporciones | Validación con Sharp |
| `backend/src/modules/images/services/r2-storage.service.ts` | Cliente S3 → R2 | R2 vía AWS SDK S3 |
| `backend/src/modules/images/services/image-validator.service.ts` | Validación + resize con sharp | Validación con Sharp |
| `backend/src/modules/images/services/images.service.ts` | Orquestación subida + URL pública | Persistencia de la URL |
| `backend/src/modules/images/controllers/images.controller.ts` | `POST /images/upload` | Multer en puntos de subida |
| `backend/src/modules/images/dto/upload-target.dto.ts` | Query `target=logo|hero` | Validación con Sharp |
| `backend/src/modules/images/dto/upload-image-response.dto.ts` | Respuesta de subida | Persistencia de la URL |
| `backend/src/modules/images/interfaces/*.ts` | Contratos DI | R2 vía AWS SDK S3 |
| `backend/src/modules/images/__tests__/*.spec.ts` | Tests (3 suites) | — |
| `backend/src/modules/landing/services/landing.service.spec.ts` | Test de `setBrandingImageUrl` | Persistencia de la URL |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `backend/src/modules/landing/controllers/landing.controller.ts` | Nuevo `POST /landing/branding/upload` | Multer en landing + persistencia |
| `backend/src/modules/landing/services/landing.service.ts` | Nuevo `setBrandingImageUrl` | Persistir URL en branding |
| `backend/src/modules/landing/landing.module.ts` | Importa `ImagesModule` | Integración |
| `backend/src/app.module.ts` | Registra `ImagesModule` | Integración |
| `backend/src/config/configuration.ts` | Variables R2 | Env R2 |
| `backend/src/config/env.d.ts` | Tipos R2 | Env R2 |
| `backend/src/config/validation.schema.ts` | Joi R2 (requeridas) | Env R2 |
| `backend/.env.example` | Bloque Cloudflare R2 | Env R2 |
| `backend/package.json` / `package-lock.json` | `@aws-sdk/client-s3`, `multer`, `sharp`, `@types/multer` | Dependencias |
| `.docs/requirements/mvp-scope.md` | Nota: backend R2 primero, frontend después | Documentación |

### Archivos eliminados

Ninguno.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Módulo `images` completo | Cumplido | Estructura verificada (controller, services, DTOs, interfaces, constants, tests) |
| Env R2 registrado y validado | Cumplido | `.env.example` + `validation.schema.ts` (Joi required) |
| Endpoint branding con Multer + png/jpg/webp + proporciones | Cumplido | `landing.controller.ts` + `image-policy.ts` + `sharp` |
| URL persistida en `Tenant.settings.landing.branding` | Cumplido | `setBrandingImageUrl` (test incluido) |
| Compilación sin errores | Cumplido | `npx tsc --noEmit` → exit 0 |
| Tests en verde | Cumplido | 4 suites / 17 tests passed |
| `.docs` actualizado | Cumplido | `mvp-scope.md` refleja backend R2; frontend en backlog |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | `POST /images/upload` genérico no persiste URL en tabla (solo el flujo de landing persiste) | BAJA | `images.controller.ts` | Futura iteración si se necesita uso genérico |
| 2 | Falta ADR nuevo documentando la decisión R2 (módulo, targets, política) | BAJA | `.docs/decisions/` | Documental |
| 3 | `R2_PUBLIC_URL` vacío por defecto → fallback al endpoint S3 (no público); definir custom domain en producción | BAJA | `.env.example` | Antes de producción |

---

## Lo que el programador debe saber

- **Módulo `images` completo y testeado:** sube a R2, valida png/jpg/webp con `sharp` (incluye anti-spoofing del MIME real), respeta proporciones por target (logo 1:1, hero 16:9, ±10%) y redimensiona si excede el máximo.
- **Dos endpoints:** `POST /images/upload` (genérico, devuelve URL/key) y `POST /landing/branding/upload?target=logo|hero` (sube y persiste la URL en `Tenant.settings.landing.branding`).
- **Env:** agregar `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (obligatorias) y `R2_PUBLIC_URL` (opcional, recomendado custom domain en producción). El backend **no arranca** sin las credenciales R2 (Joi required).
- **Frontend pendiente (backlog):** el uploader en `/admin/landing` que reemplace el input de URL se conecta en una iteración posterior, según `mvp-scope.md`.
- **Convención nueva:** toda subida de imagen debe pasar por `ImagesService.uploadImage` (validación + resize + key única `<tenant>/<target>/<uuid>.<ext>`), no por R2 directo.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-19_r2-images-backend_iter1.md` |