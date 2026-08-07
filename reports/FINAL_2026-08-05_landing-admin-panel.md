# Reporte Técnico Final
## Panel admin de personalización de la landing pública por tenant (ADR-013)

> **Generado:** 2026-08-05
> **Proyecto:** TrimFlow
> **Stack:** NestJS 10 + TypeORM + PostgreSQL · Next.js 16 (App Router) + React 19 + Tailwind 4
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

Completar, verificar y dejar listo para commit el **panel admin de personalización de la landing pública por tenant** que ya existía sin commitear en el working tree. El trabajo añade un módulo backend `landing` (config por tenant persistida en `Tenant.settings.landing` JSONB, endpoints `/landing` GET/PUT protegidos) y un panel frontend `/admin/landing` para personalizar presentación, marca/imágenes, paleta, tipografía y secciones visibles de la landing pública `/[slug]`.

**Éxito cuando:**
- El panel `/admin/landing` edita presentación, marca/imágenes, paleta, tipografía y secciones visibles.
- Los cambios se persisten vía `PUT /landing` y se reflejan en `/[slug]`.
- La landing pública consume la config fusionada sobre defaults.
- Backend y frontend compilan sin errores.
- `.docs` refleja la nueva funcionalidad (módulo landing + panel admin).

**Fuera de alcance:**
- No tocar el flujo de reserva (BookingWizard) más allá de recibir la prop `shop`.
- No cambiar el tema de los dashboards.

**Supuestos asumidos:**
- El trabajo sin commitear era la implementación de ADR-013; se validó y completó, no se reconstruyó.
- El fix de deep-merge (Paso 15) se aplicó de forma defensiva: el panel hoy envía config completa.

**Documentación en .docs:**
- PROJECT.md: cargado
- architecture/: cargado (modules.md actualizado)
- decisions/: cargado (ADR-012, ADR-013)
- requirements/: cargado (mvp-scope.md actualizado)

**Configuración del ciclo:**
- Iteraciones máx.: 3 · Modo: Automático con notificación al agotar intentos

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | — (ninguna; observaciones menores no bloqueantes) |

---

## Decisiones técnicas tomadas

### 1. Persistencia de la config de landing en `Tenant.settings.landing` (JSONB)

**Qué se decidió:**
La configuración de la landing por tenant se guarda en el campo JSONB `Tenant.settings.landing`, sin tabla dedicada ni migración. Se fusiona sobre `LANDING_DEFAULTS` con un merge profundo defensivo (`mergeLandingConfig`).

**Por qué se tomó esta decisión:**
Evita una tabla nueva y migración para un bloque de configuración que es opcional y de baja cardinalidad. El merge sobre defaults garantiza que siempre se devuelva una `LandingConfig` completa y válida, tolerante a valores nulos o parciales.

**Alternativas descartadas:**
- Tabla dedicada de config por tenant: sobre-ingeniería para un bloque de settings opcional; añade migración y joins sin beneficio real en el MVP.

**Impacto en .docs:**
- ADR-013 §1 documenta la persistencia y el merge.

**Impacto en el código:**
- `landing-config.ts` (interfaces + defaults + merge), `landing.service.ts` (lectura/escritura en settings).

### 2. Endpoints `/landing` GET/PUT protegidos con JWT + RBAC (rol admin)

**Qué se decidió:**
Se exponen `GET /landing` y `PUT /landing` bajo `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')`, escopados por `tenantId` obtenido del `@CurrentUser` (token JWT), nunca del body/URL.

**Por qué se tomó esta decisión:**
Garantiza aislamiento multi-tenant (cada admin solo lee/escribe su propia config) y restringe la personalización al rol admin. Coherente con ADR-003 (RBAC) y PROJECT.md (seguridad obligatoria, aislamiento de tenants).

**Alternativas descartadas:**
- Reutilizar los endpoints públicos `/v1/public` para la personalización: rompería la separación pública/privada de ADR-012 y expondría escritura sin autenticación.

**Impacto en .docs:**
- ADR-013 §2 documenta los contratos y la seguridad.

**Impacto en el código:**
- `landing.controller.ts`, `landing.service.ts`, `dto/update-landing-config.dto.ts`.

### 3. Aislamiento de tema por CSS variables de scope local

**Qué se decidió:**
La config de la landing se aplica SOLO a la página pública `/[slug]` mediante CSS variables `--landing-*` inyectadas en el wrapper (`landingThemeVars`). Los dashboards conservan su tema (ADR-007).

**Por qué se tomó esta decisión:**
Permite personalizar la landing por tenant sin contaminar el tema global de los paneles de administración, manteniendo la separación visual entre la cara pública y la interna.

**Alternativas descartadas:**
- Tema global mutable: habría afectado a todos los dashboards y roto la coherencia visual interna.

**Impacto en .docs:**
- ADR-013 §3 documenta el aislamiento.

**Impacto en el código:**
- `landing-theme.ts`, `[slug]/page.tsx`, `globals.css` (keyframe `landing-marquee`), `layout.tsx` (fuentes).

### 4. Fuentes Archivo / Space Grotesk vía `next/font`

**Qué se decidió:**
Se cargan `Archivo` y `Space_Grotesk` (además de `Poppins` existente) mediante `next/font/google`, con variables `--font-archivo` y `--font-space-grotesk`, mapeadas por `fontFamily()` en `landing-theme.ts`.

**Por qué se tomó esta decisión:**
Da el estilo urbano/street de la landing con fuentes auto-hospedadas y optimizadas por Next, sin peticiones externas en runtime.

**Alternativas descartadas:**
- Fuentes vía CDN externo: peor rendimiento y dependencia de terceros.

**Impacto en .docs:**
- ADR-013 §3 documenta las fuentes.

**Impacto en el código:**
- `layout.tsx`, `landing-theme.ts`.

### 5. Fix de deep-merge defensivo en `updateConfig` (Paso 15)

**Qué se decidió:**
`updateConfig` pasó de `mergeLandingConfig({ ...current, ...dto })` (shallow-spread) a `mergeLandingConfig(mergeObject(current, dto))` (deep-merge por clave), exportando `mergeObject` desde `landing-config.ts`.

**Por qué se tomó esta decisión:**
El shallow-spread con un DTO parcial anidado (p.ej. solo `palette.asphalt`) sustituía el sub-bloque completo y `mergeLandingConfig` rellenaba los demás colores con defaults, perdiendo valores ya guardados del tenant. Contradecía la semántica "actualización PARCIAL: solo cambia los campos enviados" de ADR-013.

**Alternativas descartadas:**
- Mantener el shallow-spread: riesgo de pérdida silenciosa de config guardada en PUTs parciales futuros.

**Impacto en .docs:**
- ADR-013 §2 (semántica parcial) — el fix la cumple.

**Impacto en el código:**
- `landing.service.ts`, `landing-config.ts`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `backend/src/modules/landing/landing-config.ts` | Interfaces de config, `LANDING_DEFAULTS`, `mergeObject` y `mergeLandingConfig` | Persistencia JSONB + merge defensivo |
| `backend/src/modules/landing/landing.module.ts` | Módulo Nest con `TypeOrmModule.forFeature([Tenant])` | Estructura modular del monolito |
| `backend/src/modules/landing/controllers/landing.controller.ts` | `GET /landing` y `PUT /landing` con JWT+RBAC admin | Endpoints protegidos escopados por tenant |
| `backend/src/modules/landing/services/landing.service.ts` | Lectura/escritura de config en `Tenant.settings.landing` | Persistencia + deep-merge (fix Paso 15) |
| `backend/src/modules/landing/dto/update-landing-config.dto.ts` | DTO parcial con class-validator | Actualización parcial validada |
| `frontend/src/types/landing.ts` | Espejo de tipos backend + `LANDING_DEFAULTS` + `IMAGE_GUIDES` | Consistencia de tipos front/back |
| `frontend/src/services/landing.service.ts` | Cliente `getConfig`/`updateConfig` | Consumo del panel admin |
| `frontend/src/app/(dashboard)/admin/landing/page.tsx` | Panel admin de personalización | Panel de edición de la landing |
| `frontend/src/components/landing/LandingPage.tsx` | Página pública que consume la config | Consumo en `/[slug]` |
| `frontend/src/components/landing/LandingHero.tsx` | Hero de la landing | Render con config |
| `frontend/src/components/landing/LandingSections.tsx` | Secciones (servicios, barbers, horarios, ubicación) | Render con config |
| `frontend/src/components/landing/landing-theme.ts` | Genera CSS vars `--landing-*` + `fontFamily()` | Aislamiento de tema |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `backend/src/app.module.ts` | Importa `LandingModule` | Registrar el módulo en el monolito |
| `backend/src/modules/public/services/public.service.ts` | Inyecta `landing: mergeLandingConfig(...)` en `PublicShop` | Exponer la config en `GET /v1/public/:slug` |
| `frontend/src/types/public.ts` | Añade `landing: LandingConfig` a `PublicShop` | Contrato del payload público |
| `frontend/src/app/[slug]/page.tsx` | Usa `LandingPage` en vez de `BookingWizard` directo | Render de la landing personalizada |
| `frontend/src/app/layout.tsx` | Carga fuentes Archivo y Space Grotesk | Estilo urbano de la landing |
| `frontend/src/app/globals.css` | Añade keyframe `landing-marquee` | Animación de la marquesina |
| `frontend/src/components/layouts/nav-config.tsx` | Añade ítem "Landing" (Palette) a `ADMIN_NAV` | Acceso al panel admin |
| `frontend/src/components/booking/BookingWizard.tsx` | Acepta prop opcional `shop` | Reutilizar datos de la landing |

### Archivos eliminados

| Archivo | Motivo de eliminación |
|---------|----------------------|
| — | Ninguno |

---

## Cambios en archivos clave

### `backend/src/modules/landing/services/landing.service.ts`

**Antes:** `updateConfig` usaba `mergeLandingConfig({ ...current, ...dto })` (shallow-spread) — riesgo de perder sub-bloques en PUT parcial anidado.
**Después:** `mergeLandingConfig(mergeObject(current, dto))` — deep-merge por clave que preserva los valores guardados no enviados.
**Por qué es importante:** Es el punto de escritura de la config; un merge incorrecto aquí corrompe silenciosamente la personalización del tenant.

### `backend/src/modules/landing/controllers/landing.controller.ts`

**Antes:** no existía.
**Después:** `GET /landing` y `PUT /landing` con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')`, `tenantId` desde `@CurrentUser('tenantId')`.
**Por qué es importante:** Garantiza que solo el admin de cada tenant pueda leer/modificar su propia config (aislamiento multi-tenant).

### `frontend/src/components/landing/landing-theme.ts`

**Antes:** no existía.
**Después:** genera las CSS variables `--landing-*` y mapea las fuentes elegidas a las variables de `next/font`.
**Por qué es importante:** Es el mecanismo que aísla el tema de la landing de los dashboards.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Panel `/admin/landing` edita presentación, marca, paleta, tipografía y secciones | Cumplido | Auditoría L1 [✓] + build frontend verde |
| Cambios persisten vía `PUT /landing` y se reflejan en `/[slug]` | Cumplido | Auditoría L1/L3 [✓] + fix deep-merge |
| Landing consume config fusionada sobre defaults | Cumplido | Auditoría L1/L3 [✓] (`mergeLandingConfig`) |
| Backend y frontend compilan sin errores | Cumplido | `nest build` 🟢 · `next build` 🟢 · tests 🟢 |
| `.docs` refleja la nueva funcionalidad | Cumplido | ADR-013 + modules.md + mvp-scope.md + changelog |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | Módulo `landing/` sin tests unitarios propios (servicio/controlador/DTO/merge) | MEDIA | `backend/src/modules/landing/**` | Antes de escalar la feature |
| 2 | `npm run lint` backend no ejecutable (`eslint` ausente, preexistente) | MEDIA | `backend/` (tooling) | Configurar tooling de lint |
| 3 | Verificación funcional por inspección/build, sin curls sobre infra (Postgres+Redis) | BAJA | — | Verificación manual opcional |
| 4 | Warnings `<img>` en vistas previas (URLs remotas dinámicas) | BAJA | `LandingHero.tsx`, `admin/landing/page.tsx` | Baja prioridad |
| 5 | 3 errores de lint frontend preexistentes fuera del módulo | BAJA | `BookingWizard.tsx`, hooks booking | Baja prioridad |

---

## Lo que el programador debe saber

- **El trabajo está listo para commit** pero NO se commiteó (decisión del programador). El working tree contiene el módulo landing completo, el panel admin y la documentación de `.docs/` (ADR-013).
- **Fix aplicado:** `updateConfig` ahora hace deep-merge defensivo; no pierde config guardada en PUTs parciales anidados.
- **Convención nueva a mantener:** la config de la landing se persiste en `Tenant.settings.landing` (JSONB) y se fusiona sobre `LANDING_DEFAULTS`; cualquier nueva propiedad debe añadirse a las interfaces de `landing-config.ts` (backend) y `types/landing.ts` (frontend) en espejo.
- **Aislamiento de tema:** la landing usa CSS vars `--landing-*` de scope local; no tocar el tema global de los dashboards al personalizar la landing.
- **`PublicShop.landing` es requerido:** cualquier productor/mock de `PublicShop` debe incluir el campo `landing` o romperá TypeScript.
- **Verificación manual pendiente:** se recomienda ejecutar curls funcionales contra la infra local (Postgres+Redis) para confirmar los endpoints `/landing` y la inyección en `/v1/public/:slug`.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-05_landing-admin-panel_iter1.md` |