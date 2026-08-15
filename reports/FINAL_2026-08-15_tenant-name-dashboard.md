# Reporte Técnico Final
## Feature: Nombre del tenant en el dashboard (ADR-017)

> **Generado:** 2026-08-15
> **Proyecto:** TrimFlow
> **Stack:** NestJS (backend) + Next.js App Router / TypeScript / Tailwind / shadcn-ui (frontend)
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

Completar la feature de mostrar el nombre del tenant en el sidebar del dashboard (`dashboard-shell.tsx`), que ya tenía backend, servicio y hook commiteados. El commit del cambio pendiente se realizaría **después** de la auditoría (restricción explícita del programador).

**Éxito cuando:**
- El cambio pendiente en `dashboard-shell.tsx` queda verificado y commiteado
- tsc/build frontend sin errores
- Auditoría completa contra `.docs` como fuente de verdad
- Commit post-auditoría ejecutado

**Fuera de alcance:**
- Landing pública (ADR-015/016)
- BookingWizard / reservas / schema
- Deuda técnica preexistente (lint backend any/unused, tests Toast.Provider)

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | — (ninguna; observación BAJA preexistente) |

**Fases ejecutadas:**
1. **ARCHITECT** — Documentó la feature en `.docs/` (ADR-017 nuevo + modules.md + mvp-scope.md + changelog actualizados).
2. **PLANNER** — Plan de verificación en 4 fases + matriz de consistencia `.docs` ↔ código (15 claims) + Fase 5 post-auditoría documentada.
3. **EXECUTOR** — Verificación completa: baseline, tsc exit 0, tests hook 5/5, build exit 0, matriz 3.1–3.15 con evidencia. Veredicto: LISTO PARA AUDITORÍA.
4. **AUDITOR** — 22 criterios auditados: 21 aprobados, 1 observación BAJA, 0 fallidos. Veredicto: APROBADO CON OBSERVACIONES.
5. **EXECUTOR (post-auditoría)** — Commit de los 5 paths aprobados.

---

## Decisiones técnicas tomadas

### 1. Endpoint `GET /tenants/me` scoped por token

**Qué se decidió:**
Crear un endpoint dedicado que devuelve el tenant del usuario autenticado, derivando el `tenantId` del token JWT (`@CurrentUser('tenantId')`) en lugar de recibirlo como parámetro.

**Por qué se tomó esta decisión:**
El dashboard necesita mostrar el nombre del tenant real al usuario autenticado. Derivar el tenant del token garantiza aislamiento multi-tenant (coherente con ADR-012/013) y evita exponer un parámetro manipulable.

**Alternativas descartadas:**
- Reutilizar `GET /tenants/:id` — requeriría conocer el id y validar pertenencia; más superficie de ataque.
- Incluir el nombre en el payload del login — el token no se regenera al cambiar el nombre del tenant.

**Impacto en .docs:**
ADR-017 §1 documenta el contrato (roles `admin`/`barber`, DTO `MyTenantResponseDto { id, name }`).

**Impacto en el código:**
`backend/src/modules/tenants/` — controller, service (`findMyTenant`), DTO, interfaz, spec.

### 2. Hook `useTenantName` con refetch en mount y focus

**Qué se decidió:**
Hook frontend que obtiene el nombre del tenant, con refetch al volver a la pestaña (`visibilitychange`) y al recuperar foco (`focus`), y que no dispara petición si no hay `tenantId`.

**Por qué se tomó esta decisión:**
El nombre del tenant puede cambiar (edición en super-admin); el refetch en focus mantiene el dato fresco sin polling. El guard `if (!tenantId)` evita peticiones del super-admin (que no tiene tenant).

**Alternativas descartadas:**
- Fetch único en mount — dato obsoleto tras ediciones.
- Polling periódico — innecesario y costoso.

**Impacto en .docs:**
ADR-017 §3 documenta el comportamiento (guards, listeners, cleanup, error silencioso).

**Impacto en el código:**
`frontend/src/hooks/use-tenant-name.ts` + tests.

### 3. Integración en sidebar con Skeleton

**Qué se decidió:**
En `dashboard-shell.tsx`, bajo el brand label, se muestra el nombre del tenant con un `Skeleton` mientras carga; oculto si hay error o no hay nombre.

**Por qué se tomó esta decisión:**
Evita saltos de layout (skeleton) y no rompe la UI si el endpoint falla (error silencioso).

**Alternativas descartadas:**
- Mostrar placeholder fijo — confunde al usuario.
- Mostrar error visible — ruido innecesario para un dato secundario.

**Impacto en .docs:**
ADR-017 §4 + mvp-scope.md (feature dentro del alcance MVP).

**Impacto en el código:**
`frontend/src/components/layouts/dashboard-shell.tsx`.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `.docs/decisions/ADR-017-nombre-tenant-dashboard.md` | Documenta la feature (contexto, decisión, alternativas, consecuencias) | Documentación del Architect |
| `backend/src/modules/tenants/dto/my-tenant-response.dto.ts` | DTO de respuesta del endpoint `/tenants/me` | Endpoint scoped por token (commit `80d3bf6`, previo al ciclo) |
| `frontend/src/hooks/use-tenant-name.ts` | Hook con refetch mount/focus | Hook con guards (commit `e554bfe`, previo al ciclo) |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/components/layouts/dashboard-shell.tsx` | Integra `useTenantName` en el sidebar (Skeleton + nombre truncado bajo brand label) | Mostrar el nombre del tenant al usuario autenticado |
| `.docs/architecture/modules.md` | Nota del endpoint `/v1/tenants/me` + `getMyTenant`/`useTenantName`/`MyTenant` | Reflejar la feature en la arquitectura |
| `.docs/requirements/mvp-scope.md` | Nueva sección «Nombre del tenant en el dashboard» marcada como alcance MVP | Feature dentro del MVP |
| `.docs/changelog/2026.md` | Entrada `[2026-08-15]` | Registro del cambio |

### Archivos eliminados

Ninguno.

---

## Cambios en archivos clave

### `frontend/src/components/layouts/dashboard-shell.tsx`

**Antes:** El sidebar mostraba solo el brand label genérico (p. ej. "SUPER" para super-admin).
**Después:** Bajo el brand label se muestra el nombre del tenant real (con Skeleton mientras carga, oculto si error o sin tenantId).
**Por qué es importante:** Es el layout compartido de todos los dashboards; cualquier regresión afecta a todas las vistas autenticadas. El cambio es aditivo y condicionado a `user?.tenantId`, por lo que el super-admin conserva su comportamiento previo.

### `backend/src/modules/tenants/controllers/tenant.controller.ts`

**Antes:** No existía `GET /tenants/me`.
**Después:** Endpoint `@Get('me')` con `@Roles('admin','barber')` y `@CurrentUser('tenantId')` que delega en `findMyTenant`.
**Por qué es importante:** Es la fuente de datos del nombre del tenant; el aislamiento por token es la garantía de seguridad multi-tenant.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Cambio en `dashboard-shell.tsx` verificado y commiteado | Cumplido | Commit `24e229d`; tsc exit 0; diff limitado a la feature |
| tsc/build frontend sin errores | Cumplido | `npx tsc --noEmit` exit 0; `npm run build` exit 0 |
| Auditoría completa contra .docs | Cumplido | 22 criterios: 21 [✓], 1 [!] BAJA, 0 [✗] |
| Commit post-auditoría ejecutado | Cumplido | Commits `24e229d`, `3af2a79`, `8d59870`; working tree limpio |
| Matriz de consistencia .docs ↔ código | Cumplido | 15/15 claims verificados con evidencia archivo:línea |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | 4 tests fallan en `admin/services/page.test.tsx` por falta de `<Toast.Provider>` — preexistente (verificado en worktree limpio de HEAD), ajeno a esta feature | BAJA | `frontend/src/app/(dashboard)/admin/services/page.test.tsx` | QA ticket; antes de tocar ese test |
| 2 | Nota cosmética en `modules.md:39-40` (alineación de paths) | BAJA | `.docs/architecture/modules.md` | Baja prioridad |
| 3 | Skeleton transitorio visible en refetch de focus (parpadeo breve) | BAJA | `frontend/src/components/layouts/dashboard-shell.tsx` | Baja prioridad |

---

## Lo que el programador debe saber

- **El commit se hizo después de la auditoría**, como solicitaste: `24e229d` (código), `3af2a79` (docs ADR-017), `8d59870` (reporte). Working tree limpio, sin push.
- **El super-admin no hace fetch**: al no tener `tenantId`, el hook no dispara petición y su sidebar conserva "SUPER". Comportamiento intencional documentado en ADR-017.
- **La feature quedó documentada en `.docs/`** (ADR-017 + modules.md + mvp-scope.md + changelog) — `.docs` ahora refleja el estado real del código.
- **OBS-1 (tests Toast.Provider) es preexistente** y fue verificado en un worktree limpio de HEAD: no lo introdujo esta feature. Si quieres resolverlo, es un ticket QA independiente.
- **Convención a mantener**: los reportes de `reports/` SÍ se commitean en este repo (patrón verificado); el reporte de ejecución+auditoría quedó en `8d59870`.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-15_tenant-name-dashboard_iter1.md` |