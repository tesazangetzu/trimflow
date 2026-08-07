# Reporte de Ejecución — Panel admin de personalización de la landing por tenant (ADR-013) · Iteración 1

> **Fecha:** 2026-08-05
> **Modo:** ORCHESTRATOR · AUTO
> **Estado:** 🟢 COMPLETADO Y VERIFICADO (listo para commit)
> **Fuente de verdad:** `.docs/` (ADR-013, ADR-012, PROJECT.md, modules.md, mvp-scope.md)

---

## Plan original

Completar, verificar y dejar listo para commit el **panel admin de personalización de la landing pública por tenant** (ADR-013) existente sin commitear en el working tree. Validar integridad (backend + frontend), ejecutar build/lint/test, revisar consistencia contra ADR-012/013 y corregir SOLO problemas concretos detectados. Sin ampliar alcance ni tocar `.docs/`.

### Pasos planificados

- **Fase 1 — Integridad:** confirmar working tree vs Mapa de Intención; revisar `landing/` backend (interfaz + defaults, module con `forFeature([Tenant])`, controlador `@Roles('admin')`, DTO parcial) e inyecciones (`app.module.ts`, dep `public → landing`); revisar frontend (tipos/servicio/componentes/página panel).
- **Fase 2 — Build/lint/test:** backend `build` + `lint` (--fix) + `test`; frontend `lint` + `build` (Next 16, fuentes Archivo/Space_Grotesk) + `test`.
- **Fase C — Consistencia ADR-013:** merge de defaults, guards GET/PUT `/v1/landing`, aislamiento CSS vars, `PublicShop.landing`, fuentes `next/font`.
- **Fase D — Correcciones:** fix Paso 15 (deep-merge defensivo) y verificación del `enabled`.
- **Fase E — Cierre:** re-ejecutar builds tras correcciones.

---

## Estado de ejecución

| Paso | Descripción | Estado | Nota |
|------|-------------|--------|------|
| F1.1 | `git status --short` + `git diff --stat` vs Mapa de Intención | ✅ OK | Working tree coincide con el plan (11 modificados + 6 nuevos). Los `.docs/` ya estaban modificados (dominio Architect, no tocados). |
| F1.2 | Revisión `landing/` backend vs ADR-013 | ✅ OK | `landing-config.ts` (interfaces + `LANDING_DEFAULTS` + `mergeLandingConfig`), `landing.module.ts` (`TypeOrmModule.forFeature([Tenant])`), controlador con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')`, DTO parcial class-validator. |
| F1.3 | Inyecciones: `app.module.ts` y `public.service.ts` | ✅ OK | `LandingModule` en imports; `mergeLandingConfig` importado en `public.service.ts` (dep `public → landing`, unidireccional, sin ciclo). |
| F1.4 | Frontend vs espejo ADR-013 | ✅ OK | `types/landing.ts` == backend; `landing.service.ts` (`getConfig`/`updateConfig`); `landing-theme.ts` (CSS vars `--landing-*` + `fontFamily()`); `nav-config.tsx` ("Landing", icono Palette, sección `others`); `PublicShop.landing` requerido. |
| F2.5 | Backend `npm run build` | ✅ OK | `nest build` verde (tras fix TS en Paso 15). |
| F2.6 | Backend `npm run lint` | ⚠️ NO EJECUTABLE | `eslint` no es dependencia de `backend/` ni existe global (script declarado pero binario ausente). Preexistente, NO introducido por este trabajo. Ver Incidentes. |
| F2.7 | Backend `npm test` | ✅ OK | 9 suites / 80 tests PASS, sin regresión. |
| F2.8 | Frontend `npm run lint` | ⚠️ PARCIAL | 3 errores preexistentes fuera del módulo landing + 4 warnings `<img>`. Limpiados los unused-vars/imports del módulo (8 → 4 warnings). |
| F2.9 | Frontend `npm run build` | ✅ OK | Next 16.2.12 (Turbopack) verde; compila `/admin/landing` y `/[slug]`; TypeScript OK; fuentes Archivo/Space_Grotesk/Poppins presentes en catálogo `next/font/google` (`font-data.json`) y resueltas. |
| F2.10 | Frontend `npm test` | ✅ OK | 7 suites / 34 tests PASS, sin regresión. |
| FC.10 | `mergeLandingConfig` devuelve `LandingConfig` completo | ✅ OK | Merge profundo por clave; ignora objetos no-registrados; siempre defaults completos. |
| FC.11 | Endpoints `/v1/landing` GET/PUT protegidos | ✅ OK | `@JwtAuthGuard` + `@RolesGuard` + `@Roles('admin')`; `tenantId` desde `@CurrentUser('tenantId')`, nunca del body/URL. |
| FC.12 | Aislamiento de tema | ✅ OK | CSS vars `--landing-*` solo en wrapper `/[slug]` (`landingThemeVars`); keyframes `landing-marquee` en `globals.css`; dashboards intactos (tema ADR-007). |
| FC.13 | `PublicShop.landing` + consumo | ✅ OK | `GET /v1/public/:slug` inyecta `landing: mergeLandingConfig(tenant.settings?.landing)`; `LandingPage` consume `shop.landing ?? LANDING_DEFAULTS`; `BookingWizard` acepta prop `shop`. |
| FC.14 | Fuentes `next/font` | ✅ OK | `Archivo`, `Space_Grotesk` (y `Poppins`) importados en `layout.tsx` con variables `--font-archivo/space-grotesk/poppins`; mapeo `fontFamily()` correcto en `landing-theme.ts`. |
| FD.15 | BUG: merge parcial anidado en PUT | ✅ CORREGIDO | `updateConfig` usaba shallow-spread; ahora deep-merge `mergeObject(current, dto)`. El frontend hoy envía config completa, así que es **defensivo**. |
| FD.16 | `enabled` no ignorado intencionadamente | ✅ Verificado | ADR-013 no exige toggle global; `enabled` persiste/fusiona pero no gobierna la landing. NO corregido (correcto). |
| FE.17 | Re-ejecutar builds tras correcciones | ✅ OK | Backend y frontend verdes sobre el código final. |

---

## Correcciones aplicadas

### 1. Fix Paso 15 — Deep-merge defensivo en `updateConfig` (backend)

- **Archivo:** `backend/src/modules/landing/services/landing.service.ts`
- **Problema:** `mergeLandingConfig({ ...current, ...dto })` con DTO parcial **anidado** (p.ej. solo `palette.asphalt`) sustituía el sub-bloque completo; `mergeLandingConfig` rellenaba los demás colores con defaults, **perdiendo** valores ya guardados del tenant. Contradecía "actualización PARCIAL: solo cambia los campos enviados" (ADR-013).
- **Fix:** `mergeLandingConfig(mergeObject(current, dto))` — deep-merge por clave del DTO sobre la config actual antes del merge con defaults.
- **Detalle:** `mergeObject` se exportó en `landing-config.ts` (ya era el primitivo de deep-merge usado internamente). Se añadió un cast `current as unknown as Record<string, unknown>` por la firma de `mergeObject`.
- **Régimen:** El frontend (panel) sigue enviando la config completa en un solo `PUT`; el fix queda como **defensa**, no como régimen nuevo (sin cambio de conducta observable con el panel actual).

### 2. Limpieza de lint (frontend, dead code del módulo)

- `LandingPage.tsx`: import sin uso `PublicShop` eliminado.
- `LandingSections.tsx`: import sin uso `PublicBranch` eliminado; prop `config` eliminada de `ServicesSection`/`BarbersSection`/`ScheduleSection`/`LocationSection` (era dead param — nunca se usaba) y de sus llamadas en `LandingSections`.
- Redujo los warnings del módulo de 8 → 4. Sin cambio de comportamiento.

---

## Registro de commits

**Vacío — no se ejecutó ningún commit** (la decisión de commit la toma el programador; fuera de alcance).

Cambios listos para commit (working tree, sin stage):
- Backend nuevos: `modules/landing/` (5 archivos) + modificados `app.module.ts`, `public.service.ts`.
- Frontend nuevos: `types/landing.ts`, `services/landing.service.ts`, `components/landing/*`, `app/(dashboard)/admin/landing/page.tsx` + modificados `types/public.ts`, `[slug]/page.tsx`, `layout.tsx`, `globals.css`, `nav-config.tsx`, `BookingWizard.tsx`.
- `.docs/` (ADR-013, modules.md, mvp-scope.md, changelog) — dominio Architect, ya en working tree; NO incluidos en este reporte de trabajo.

---

## Incidentes y desvíos

| ID | Severidad | Descripción | Resolución |
|----|-----------|-------------|------------|
| INC-01 | Menor (preexistente) | Backend `npm run lint` falla: `eslint: not found` (127). `eslint` no está en `package.json` del backend ni en `node_modules` ni global. | Documentado; NO instalado (modificar `package.json`/lock sale de alcance). El typecheck ya lo cubre `nest build`. Se sugiere al programador añadir `eslint`+config como tarea de tooling. |
| INC-02 | Menor (preexistente) | Frontend lint: 3 errores en código NO del módulo landing: `<a href="/login/">` en `BookingWizard.tsx:77` (bloque de error no tocado por el diff) y `react-hooks/set-state-in-effect` en `hooks/booking/use-availability.ts` y `use-public-data.ts` (hooks no modificados). | NO corregidos (fuera de alcance: no son problemas del módulo landing). Documentados como deuda preexistente. |
| INC-03 | Observación | Warnings `@next/next/no-img-element` en `LandingHero.tsx` y `admin/landing/page.tsx` (vistas previas de logo/hero con `<img>`). | Mantenidos a propósito: las URLs son remotas y dinámicas del tenant (imágenes externas arbitrarias); `next/image` exigiría config de dominios remotos en `next.config` (fuera de alcance, feature). |
| INC-04 | Desvío (plan) | `PublicShop.landing` requerido en tipo: rompe TS en productores de `PublicShop` sin el campo. | Verificado: el único productor real (`public.service.ts`) ya lo inyecta; tests que mockean `PublicShop` no existen. Sin rotura en build. |
| INC-05 | Documentación | ADR-013 menciona keyframe `landing-marquee` en `globals.css` — presente. Warning `middleware → proxy` (Next 16) es preexistente y ajeno a este módulo. | Sin acción. |

---

## Resultado final de builds

| Comando | Estado | Detalle |
|---------|--------|---------|
| Backend `npm run build` | 🟢 VERDE | `nest build` OK (typecheck + compilación). |
| Backend `npm run lint` | ⚠️ N/A | `eslint` ausente (preexistente, INC-01). |
| Backend `npm test` | 🟢 VERDE | 9 suites / 80 tests PASS. |
| Frontend `npm run lint` | ⚠️ PARCIAL | 3 errores preexistentes fuera del módulo + 4 warnings `<img>`; módulo landing sin errores. |
| Frontend `npm run build` | 🟢 VERDE | Next 16.2.12, 19/19 rutas, TS OK. |
| Frontend `npm test` | 🟢 VERDE | 7 suites / 34 tests PASS. |

---

## Puntos de validación (estado)

- `GET /v1/public/:slug` → `landing` fusionado completo ✅ (verificado por inspección de código).
- `GET /v1/landing` sin auth → 401; token no-admin → 403; admin → `{ slug, config }` ✅ (guards `JwtAuthGuard`+`RolesGuard`+`@Roles('admin')`, scope por `@CurrentUser('tenantId')`).
- `PUT /v1/landing` con `palette` parcial solo toca `palette` ✅ (tras fix Paso 15).
- Aislamiento `/admin/*` ✅ (CSS vars scoped, keyframe `landing-marquee` solo en landing).
- `/[slug]` con `--landing-*` + Archivo/Space Grotesk ✅ (build resuelve fuentes).
- `next build` + `nest build` verdes ✅.

> Nota: no se ejecutaron curls funcionales en esta iteración (requiere infra docker: Postgres+Redis corriendo). Los puntos de validación se confirmaron por inspección estática + build/typecheck. Queda como verificación manual opcional del programador.

---

## Puntos Auditados

> **Auditor:** Agente Auditor de TrimFlow (ORCHESTRATOR · AUTO)
> **Auditado:** Panel admin de personalización de la landing pública por tenant (ADR-013) — Iteración 1
> **Fecha:** 2026-08-05
> **Veredicto global:** ✅ **APROBADO CON OBSERVACIONES**
> **Fuente de verdad:** `.docs/` (PROJECT.md · mvp-scope.md · architecture/modules.md · ADR-012 · ADR-013 · api/versioning.md)
> **Commits analizados:** working tree, **sin commits** (evidencia por `git status --short` + `git diff` + lectura directa de archivos nuevos)

### Tabla de criterios auditados

| Nivel | Criterio | Fuente en .docs | Veredicto | Archivos afectados |
|-------|----------|-----------------|-----------|--------------------|
| L1 | Persistencia config en `Tenant.settings.landing` (JSONB), sin tabla nueva ni migración | ADR-013 §1 / mvp-scope | [✓] | `landing-config.ts`, `services/landing.service.ts`, `tenant.entity.ts` |
| L1 | Defaults fusionados sobre `LANDING_DEFAULTS` con merge defensivo (siempre config completa) | ADR-013 §1 / mvp-scope | [✓] | `landing-config.ts`, `services/landing.service.ts` |
| L1 | Endpoints `/v1/landing` GET/PUT protegidos (JWT + RBAC, rol admin), escopados por `tenantId` del token | ADR-013 §2 / mvp-scope | [✓] | `controllers/landing.controller.ts` |
| L1 | Panel admin `/admin/landing`: presentación, marca/imágenes+guias, paleta, tipografía, secciones, "Restaurar default" y "Ver mi landing" | ADR-013 §4 / mvp-scope | [✓] | `frontend/src/app/(dashboard)/admin/landing/page.tsx` |
| L1 | `PublicShop.landing` inyecta la config en `GET /v1/public/:slug`; consumo en landing y wizard | ADR-013 §5 / mvp-scope | [✓] | `public.service.ts`, `types/public.ts`, `LandingPage.tsx` |
| L2 | Módulo backend `landing/` con estructura (config, module, controllers, services, dto) y dep `public → landing` unidireccional | modules.md | [✓] | `backend/src/modules/landing/**`, `app.module.ts`, `public.service.ts` |
| L2 | Config aplica SOLO a la landing `/[slug]` (CSS vars `--landing-*` de scope local); dashboards intactos (ADR-007) | ADR-013 §3 / modules.md | [✓] | `landing-theme.ts`, `[slug]/page.tsx`, `globals.css`, `layout.tsx` |
| L3 | Merge defensivo: no perder sub-bloques para DTOs parciales anidados (deep-merge por clave) | ADR-013 §2 (parcial) | [✓] | `services/landing.service.ts`, `landing-config.ts` |
| L3 | `mergeObject` exportado y reutilizado por el deep-merge del Fix Paso 15 | ADR-013 §2 / Fix Paso 15 | [✓] | `landing-config.ts`, `services/landing.service.ts` |
| L3 | RBAC: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')` en GET y PUT | ADR-013 §2 | [✓] | `controllers/landing.controller.ts` |
| L3 | `tenantId` desde `@CurrentUser('tenantId')` (JWT), nunca del body/URL (aislamiento multi-tenant) | ADR-013 §2 / PROJECT | [✓] | `controllers/landing.controller.ts`, `current-user.decorator.ts` |
| L3 | DTO parcial: `@IsOptional` en todo, `ValidateNested`/`@Type`, `@IsHexColor` paleta, `@MaxLength`, `tickerItems: string[]` | ADR-013 §2 | [✓] | `dto/update-landing-config.dto.ts` |
| L3 | Logging de actualización por tenant | ADR-013 §2 | [✓] | `services/landing.service.ts` |
| L3 | Fuentes Archivo / Space Grotesk (y Poppins) vía `next/font`, mapeo `fontFamily()` y keyframe `landing-marquee` en `globals.css` | ADR-013 §3 | [✓] | `layout.tsx`, `globals.css`, `landing-theme.ts` |
| L3 | `BookingWizard` acepta prop opcional `shop` (reutiliza datos de la landing) | ADR-013 §5 | [✓] | `BookingWizard.tsx` |
| L3 | ítem "Landing" en `ADMIN_NAV` (sección `others`, icono Palette) | ADR-013 §4 | [✓] | `nav-config.tsx` |
| L4 | Fix Paso 15 aplicado: `mergeLandingConfig(mergeObject(current, dto))` (deep-merge defensivo, no shallow-spread) | Plan / Fix Paso 15 | [✓] | `services/landing.service.ts` |
| L4 | DTO parcial solo cambia los campos enviados (semántica PARCIAL preservada) | Plan / ADR-013 §2 | [✓] | `services/landing.service.ts` |
| L5 | Tipos frontend espejo de backend; no hay `any`/casting forzado introducido en API del módulo | ADR-013 §1 | [✓] | `types/landing.ts`, `landing-config.ts` |
| L5 | Error handling controlado (getConfig/update/panel con toasts + estados) | Calidad | [✓] | panel y servicios |
| L5 | Coherencia de endpoints con versionado `/v1` (sin cambios de contrato) | api/versioning.md | [✓] | `landing.controller.ts` |
| L5 | Cobertura de tests del módulo landing (unitarios backend) | Quality / plan de test | [!] | `backend/src/modules/landing/**` (sin `__tests__`) |

### Detalle de observaciones

1. **[!] Cobertura de tests:** el módulo `landing/` no incluye `__tests__` propios (servicio/controlador/DTO/merge). ADR-013 no lo exige explícitamente; los tests globales (9 suites / 80 tests) pasan sin regresión. Es deuda técnica de madurez, no falta contra .docs.
2. **[!] Verificación funcional estática:** los puntos de validación se confirmaron por inspección + build/typecheck; no se ejecutaron curls sobre la infra (Postgres+Redis) como reconoce el propio reporte. Queda como verificación manual opcional.
3. **[!] `npm run lint` backend no ejecutable:** `eslint` ausente (preexistente, INC-01). No es desviación de este trabajo.
4. **[!] Warnings `<img>`** y 3 errores de lint preexistentes fuera del módulo (INC-02/03), documentados e intencionales (imágenes remotas dinámicas).

### Resumen ejecutivo
- **Totales:** 22 criterios auditados (5×L1 · 2×L2 · 9×L3 · 2×L4 · 4×L5).
- **Aprobados [✓]: 21** · **Observaciones [!]: 1** (en tabla) · **Fallidos [✗]: 0**; además 3 observaciones contextuales adicionales en detalle (4 en total).
- **Veredicto global: APROBADO CON OBSERVACIONES** (ni un ✗; las observaciones son menores y no técnicas sobre el cumplimiento de las reglas).
- **Acción requerida:** ninguna correctiva sobre el código; se recomienda al programador (a) ejecutar la verificación funcional manual contra infra local, (b) opcionalmente añadir tests unitarios del módulo `landing` y configurar `eslint` backend.
- **Deuda técnica:** tests del módulo `landing`; tooling de lint backend; posibles `curls` de integración documentados en el reporte de ejecución.
