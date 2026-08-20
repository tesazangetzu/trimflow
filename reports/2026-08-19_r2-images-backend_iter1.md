# Reporte de ejecución y auditoría — R2 imágenes backend (Iteración 1)

> **Fecha:** 2026-08-19 · **Objetivo:** `r2-images-backend`

## Trabajo ejecutado (ya presente en working tree, validado en esta iteración)

### Módulo nuevo `backend/src/modules/images/`
- `constants/image-policy.ts` — targets `logo | hero`, MIME permitidos (png/jpg/webp), `MAX_FILE_SIZE` 10MB, `RATIO_TOLERANCE` ±10%, políticas por target (logo 1:1 max 512px; hero 16:9 max 1920×1080).
- `services/r2-storage.service.ts` — cliente S3 apuntando al endpoint R2 (`https://<accountId>.r2.cloudflarestorage.com`, region `auto`), `PutObjectCommand`, destrucción del cliente en shutdown.
- `services/image-validator.service.ts` — valida MIME + extensión, re-verifica el formato real con `sharp` (anti-spoofing), valida proporción objetivo (±10%) y redimensiona `fit: 'inside'` si excede el máximo.
- `services/images.service.ts` — orquesta: validar → key única `<tenant>/<target>/<uuid>.<ext>` → subir a R2 → construir URL pública (`R2_PUBLIC_URL` o fallback derivado del account id).
- `controllers/images.controller.ts` — `POST /images/upload` (admin), `FileInterceptor`, valida MIME en fileFilter.
- `dto/upload-target.dto.ts`, `dto/upload-image-response.dto.ts`, interfaces, `images.module.ts` (DI por tokens).

### Integración en Landing
- `landing.controller.ts` — nuevo `POST /landing/branding/upload` (admin) con Multer; sube vía `ImagesService` y persiste la URL en `branding.logoUrl`/`heroImageUrl` según `target`.
- `landing.service.ts` — nuevo `setBrandingImageUrl(tenantId, field, url)` que persiste la URL sin tocar el resto de la config.
- `landing.module.ts` — importa `ImagesModule`.

### Config / infraestructura
- `configuration.ts`, `env.d.ts`, `validation.schema.ts` — variables R2 (account id, access key, secret, bucket, public url); Joi marca como requeridas las de credenciales.
- `.env.example` — bloque `Cloudflare R2` documentado.
- `app.module.ts` — registra `ImagesModule`.
- `package.json` — `@aws-sdk/client-s3`, `multer`, `sharp`, `@types/multer`.
- Tests: `r2-storage.service.spec.ts`, `images.service.spec.ts`, `image-validator.service.spec.ts`, `landing.service.spec.ts` (este último nuevo).

## Verificación mecánica

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` (backend) | ✅ exit 0 |
| `npx jest images landing` | ✅ 4 suites / 17 tests passed |

## Auditoría contra `.docs`

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| `mvp-scope.md` indica implementar primero backend R2 (frontend en iteración posterior) | ✅ Cumplido | El módulo es backend-only; frontend queda en backlog |
| Persistencia de la ruta en tablas/config necesarias | ✅ Cumplido | `setBrandingImageUrl` → `Tenant.settings.landing.branding.*` |
| Multer donde se necesita (landing marca/imagen) | ✅ Cumplido | `FileInterceptor` en ambos controllers |
| Restricción png/jpg/webp manteniendo proporciones | ✅ Cumplido | `image-policy.ts` + `sharp` (validación + resize + ratio) |
| Env con llaves R2 registradas | ✅ Cumplido | `.env.example`, `configuration.ts`, `validation.schema.ts` |
| Endpoint protegido (JWT + RBAC admin), escopado por tenant | ✅ Cumplido | Guards + `@CurrentUser('tenantId')` |
| Compilación y tests en verde | ✅ Cumplido | tsc 0, 17 tests passed |

## Observaciones (severidad BAJA, no bloqueantes)

1. El endpoint genérico `POST /images/upload` sube a R2 y devuelve URL/key pero **no persiste** la URL en ninguna tabla (persistencia solo ocurre en el flujo de landing). Aceptable: el objetivo concreto (branding) persiste; un uso genérico con persistencia sería futura iteración.
2. No se registró un ADR nuevo para documentar la decisión de R2 (módulo, targets, política de imágenes). Recomendable como ADR-0xx (documental, se puede añadir después).
3. `R2_PUBLIC_URL` queda vacío por defecto; en ese caso se usa el fallback derivado del account id (endpoint S3, no público por defecto). Requiere definir custom domain al desplegar en producción.

## Veredicto

**APROBADO CON OBSERVACIONES** (solo severidad BAJA — sin bloqueantes, no requiere reiteración).
