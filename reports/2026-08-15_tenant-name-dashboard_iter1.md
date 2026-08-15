# Reporte de Verificación — Nombre del tenant en el dashboard (ADR-017)

- **Fecha:** 2026-08-15
- **Agente:** Executor-agent (verificación, fase pre-auditoría)
- **Trigger:** TRIGGER=ORCHESTRATOR MODE=AUTO
- **Objetivo:** Verificación 100% de solo-lectura del cambio pendiente para la feature "nombre de tenant en el dashboard". Sin commits, sin modificaciones de código ni `.docs`.

---

## Resultado por paso

| Paso | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1.1 | Working tree = 5 paths exactos | ✅ PASS | `git status --porcelain` lista exactamente los 5 paths esperados (ver §F1) |
| 1.2 | HEAD = `e554bfe`, con `3708c7e` y `80d3bf6` debajo | ✅ PASS | `git log --oneline -4` |
| 2.1 | Diff de dashboard-shell.tsx limitado a la feature | ✅ PASS | Ver §F2.1 |
| 2.2 | Hook y servicio consistentes | ✅ PASS | Ver §F2.2 |
| 2.3 | `tenantId?: string` en tipo User | ✅ PASS | `frontend/src/types/auth.ts` (2 ocurrencias) |
| 2.4 | Typecheck frontend exit 0 | ✅ PASS | `npx tsc --noEmit` → EXIT=0 |
| 2.5 | 5 tests del hook pasan | ✅ PASS | `npx jest use-tenant-name.test.tsx` → 5/5 passed |
| 2.6 | Suite completa exit 0 | ⚠️ OBSERVACIÓN (no bloquea) | 4 tests fallan en `admin/services/page.test.tsx` — **preexistente y ajeno a la feature** (ver OBS-1) |
| 2.7 | Build exit 0 | ✅ PASS | `npm run build` → EXIT=0 (sin fallo por env) |
| 3.1 | Controller `GET /tenants/me` con roles y CurrentUser | ✅ PASS | `backend/src/modules/tenants/controllers/tenant.controller.ts:33-45` |
| 3.2 | `MyTenantResponseDto { id, name }` con `@ApiProperty` | ✅ PASS | `backend/src/modules/tenants/dto/my-tenant-response.dto.ts:3-9` |
| 3.3 | `findMyTenant` lanza EntityNotFoundException + logging | ✅ PASS | `backend/src/modules/tenants/services/tenant.service.ts:76-83` |
| 3.4 | Pruebas de éxito y excepción | ✅ PASS | `backend/src/modules/tenants/services/tenant.service.spec.ts:161-178` |
| 3.5 | Interfaz con `findMyTenant` | ✅ PASS | `backend/src/modules/tenants/interfaces/tenants-service.interface.ts:10` |
| 3.6 | Tipo `MyTenant` | ✅ PASS | `frontend/src/types/tenant.ts:3-6` |
| 3.7 | Servicio `getMyTenant` → `/tenants/me` | ✅ PASS | `frontend/src/services/tenants.service.ts:4-7` |
| 3.8 | Hook con refetch mount/focus, guards, cleanup, error silencioso | ✅ PASS | `frontend/src/hooks/use-tenant-name.ts` + tests |
| 3.9 | Skeleton mientras carga, oculto en error | ✅ PASS | `frontend/src/components/layouts/dashboard-shell.tsx` (diff 2.1) |
| 3.10 | modules.md menciona `/v1/tenants/me` y getMyTenant/use-tenant-name/MyTenant | ✅ PASS | `git diff .docs/architecture/modules.md` (líneas +39-40, +258-260) |
| 3.11 | mvp-scope.md con 3 checkboxes `[x]` | ✅ PASS | `git diff .docs/requirements/mvp-scope.md` |
| 3.12 | Hashes `80d3bf6`/`3708c7e`/`e554bfe` verificados | ✅ PASS | `git show --stat` de los 3 commits |
| 3.13 | Sin cambios de contrato ni migración de DB | ✅ PASS | `git log --stat -4` + `git status` |
| 3.14 | `my-tenant-response.dto.ts` listado como nuevo | ✅ PASS | `git show --name-status 80d3bf6` → `A` |
| 3.15 | Super-admin sin fetch (guards de tenantId) | ✅ PASS | `dashboard-shell.tsx` + `use-tenant-name.ts:12,26` |
| 4.1 | Estado final idéntico a 1.1 | ✅ PASS | `git status --porcelain` |
| 4.2 | Sin commit accidental (HEAD intacto) | ✅ PASS | `git log --oneline -1` = `e554bfe` |

---

## Evidencia FASE 1 (baseline)

**F1 — Working tree (1.1):**
```
 M .docs/architecture/modules.md
 M .docs/changelog/2026.md
 M .docs/requirements/mvp-scope.md
 M frontend/src/components/layouts/dashboard-shell.tsx
?? .docs/decisions/ADR-017-nombre-tenant-dashboard.md
```
Coincide exactamente con los 5 paths esperados. Sin archivos extra.

**F1 — Log (1.2):**
```
e554bfe feat(frontend): add useTenantName hook with mount and focus refetch
3708c7e feat(frontend): add MyTenant type and getMyTenant service
80d3bf6 feat(backend): add GET /tenants/me endpoint scoped by token tenantId
a30e999 docs: reporte técnico final del cierre del ciclo ADR-016
```

---

## Evidencia FASE 2 (técnica)

**F2.1 — Diff dashboard-shell.tsx (2.1):**
Toca exclusivamente:
- `import { useTenantName } from "@/hooks/use-tenant-name"` (línea +8 del diff) y `import { Skeleton } from "@/components/ui/skeleton"` (línea +14 del diff).
- Llamada `useTenantName(user?.tenantId)` (desestructuración `{ tenantName, loading: tenantLoading, error: tenantError }`).
- Bloque del sidebar: `{user?.tenantId && (<> {tenantLoading ? <Skeleton …/> : tenantError || !tenantName ? null : <span …>{tenantName}</span>} </>)}`, dentro de un `div` flex que envuelve el brand label.
- No toca nav/colapsado/header. Ambos imports añadidos se usan en el bloque → sin imports huérfanos.

**F2.2 — Hook y servicio (2.2):**
- `frontend/src/hooks/use-tenant-name.ts:6` — `export function useTenantName(tenantId?: string)`; retorno `{ tenantName, loading, error }` (línea 44).
- `frontend/src/services/tenants.service.ts:4-7` — `getMyTenant(): Promise<MyTenant>` → `api.get("/tenants/me")`.

**F2.3 — Tipo User (2.3):** `frontend/src/types/auth.ts` contiene `tenantId?: string` (2 interfaces).

**F2.4 — Typecheck (2.4):** `npx tsc --noEmit` → exit 0.

**F2.5 — Tests hook (2.5):** 1 suite / 5 tests passed (sin fetch sin tenantId, fetch en mount, refetch en visibility, refetch en focus, cleanup en unmount).

**F2.6 — Suite completa (2.6):** `Test Suites: 1 failed, 7 passed, 8 total; Tests: 4 failed, 35 passed, 39 total`. Único fallo: `admin/services/page.test.tsx` (ver OBS-1). No es fallo de cobertura; es preexistente y verificado como tal.

**F2.7 — Build (2.7):** `npm run build` → exit 0, sin errores de env ausentes.

---

## Matriz de evidencia FASE 3 (.docs ↔ código)

| # | Claim en .docs | Evidencia archivo:línea | Resultado |
|---|---|---|---|
| 3.1 | `GET /tenants/me` con `@Roles('admin','barber')` y `@CurrentUser('tenantId')` | `tenant.controller.ts:33` `@Get('me')`; `:34` `@Roles('admin', 'barber')`; `:39` `findMyTenant(@CurrentUser('tenantId') tenantId?: string)` | ✅ |
| 3.2 | `MyTenantResponseDto { id, name }` con `@ApiProperty` | `my-tenant-response.dto.ts:3-9` (`@ApiProperty()` en :4 y :7) | ✅ |
| 3.3 | `findMyTenant` lanza `EntityNotFoundException` + logging | `tenant.service.ts:76` firma; `:79` `throw new EntityNotFoundException(...)`; `:81` `this.logger.log(...)` | ✅ |
| 3.4 | Pruebas de éxito y excepción | `tenant.service.spec.ts:161-178` — éxito (:162-172, incl. `expect(mockLogger.log)` :171); excepción `EntityNotFoundException` (:174-178) | ✅ |
| 3.5 | Interfaz con `findMyTenant` | `tenants-service.interface.ts:10` `findMyTenant(tenantId: string): Promise<Tenant>` | ✅ |
| 3.6 | Tipo `MyTenant` | `frontend/src/types/tenant.ts:3-6` `interface MyTenant { id: string; name: string }` | ✅ |
| 3.7 | Servicio `getMyTenant` → `/tenants/me` | `frontend/src/services/tenants.service.ts:4-7` | ✅ |
| 3.8 | Hook: refetch mount/focus, sin fetch sin tenantId, cleanup, error silencioso | `use-tenant-name.ts:12` y `:26` guard `if (!tenantId) return`; `:25-42` useEffect con `visibilitychange`/`focus` + cleanup `:38-41`; `:18-19` `catch` silencioso. Tests: `__tests__/use-tenant-name.test.tsx:27-77` | ✅ |
| 3.9 | Skeleton mientras carga, oculto en error | `dashboard-shell.tsx` (diff 2.1): `tenantLoading ? <Skeleton/> : tenantError \|\| !tenantName ? null : <span/>` | ✅ |
| 3.10 | modules.md: `/v1/tenants/me` y `getMyTenant`/`use-tenant-name`/`MyTenant` | diff `modules.md` +39-40 (endpoint en módulo tenants) y +258-260 (services/hooks/types). Rutas reales coincidentes | ✅ |
| 3.11 | mvp-scope.md: 3 checkboxes `[x]` | diff `mvp-scope.md`: 3 ítems `[x]` en sección "Nombre del tenant en el dashboard" | ✅ |
| 3.12 | Hashes `80d3bf6`/`3708c7e`/`e554bfe` | changelog 2026.md (entrada 2026-08-15, línea +4). `git show --stat`: `80d3bf6` = backend endpoint (controller/dto/interfaz/servicio/spec), `3708c7e` = service+type frontend, `e554bfe` = hook+test | ✅ |
| 3.13 | "No se modifica ningún contrato existente ni migración de DB" | `git log --stat -4`: los 3 commits son aditivos (80d3bf6: 55 ins / 0 del; e554bfe: solo archivos nuevos; 3708c7e: import + función nueva). Sin migraciones (`backend/src/migrations` sin diff). La única "deleción" en 3708c7e es el import `tenant.ts` reescrito (ampliación, no contrato roto) | ✅ |
| 3.14 | `my-tenant-response.dto.ts` listado como "nuevo" | `git show --name-status 80d3bf6` → `A backend/src/modules/tenants/dto/my-tenant-response.dto.ts` | ✅ |
| 3.15 | "El super-admin no hace fetch" (sin tenantId) | `dashboard-shell.tsx`: guard `user?.tenantId &&`; `use-tenant-name.ts:12` `if (!tenantId) return` | ✅ |

---

## Hallazgos y observaciones

**OBS-1 — Suite frontend con 4 tests fallidos (paso 2.6), PREEXISTENTE, NO BLOQUEA.**
- Fallo: `admin/services/page.test.tsx` — `Base UI: useToastManager must be used within <Toast.Provider>` (los renders de `ServicesPage` no están envueltos en `<Toast.Provider>`).
- Evidencia de preexistencia (100% verificado): se ejecutó `npm test` en un **worktree limpio de HEAD `e554bfe`** (sin el diff pendiente, vía `/tmp/opencode/tf-head`, node_modules symlink; worktree eliminado al final sin tocar el working tree). Resultado idéntico: `1 failed, 7 passed, 8 total; 4 failed, 35 passed, 39 total`.
- El test no depende de la feature: no importa `DashboardShell`, `use-tenant-name`, `tenants.service` ni `MyTenant`; solo mockea `service-offering.service`. El último commit que tocó ese test es `c39d276` (anterior a la feature).
- Clasificación: observación preexistente análoga a las excepciones del plan (2.6 cobertura / 2.7 env). No es regresión del cambio pendiente.

**OBS-2 — Notable, sin impacto:** `getMyTenant()` ignora el `tenantId` recibido por el hook (el endpoint escopa por el token JWT); el guard del hook (sin tenantId → no fetch) es lo que evita peticiones del super-admin. Consistente con ADR-017.

**OBS-3 — Proceso:** la verificación usó un worktree temporal (`/tmp/opencode/tf-head`) únicamente para probar preexistencia; fue eliminado. Working tree intacto (F4.1).

---

## Veredicto final

**LISTO PARA AUDITORÍA**

- FASE 1: ✅ baseline íntegro (5 paths, HEAD `e554bfe`).
- FASE 2: ✅ técnica (typecheck, tests hook 5/5, build OK). ⚠️ OBS-1 preexistente y ajeno a la feature, no bloquea.
- FASE 3: ✅ matriz 3.1–3.15 completa, 15/15 claims verificados con evidencia.
- FASE 4: ✅ estado final idéntico a 1.1, HEAD intacto (`e554bfe`), sin commits.

Sin hallazgos de inconsistencia en el cambio pendiente. El único fallo de suite (OBS-1) es preexistente y ajeno. Sin auto-corrección ni modificaciones realizadas. Se entrega el estado "listo para auditoría" al Auditor.

---

# Auditoría — Nombre del tenant en el dashboard (ADR-017)

- **Fecha:** 2026-08-15
- **Agente:** Auditor-agent (re-validación independiente, solo-lectura)
- **Fuente de verdad:** `.docs` (mvp-scope.md, modules.md, ADR-017, ADR-015/016, changelog)
- **Alcance:** matriz Fase 3 (3.1–3.15), diff pendiente de `dashboard-shell.tsx`, documentación del Architect, OBS-1 del Executor, estado del working tree.

## 1. Tabla de criterios auditados

| # | Criterio | Fuente en .docs | Veredicto | Evidencia propia (Auditor) |
|---|---|---|---|---|
| A1 | Working tree = 5 paths exactos (4 mod + 1 nuevo ADR-017) + reporte | Plan (F1) | [✓] | `git status`: `M modules.md`, `M changelog/2026.md`, `M mvp-scope.md`, `M dashboard-shell.tsx`, `?? ADR-017`, `?? reporte`. Sin archivos extra |
| A2 | HEAD = `e554bfe`, sin commits nuevos | Plan (1.2/4.2) | [✓] | `git rev-parse HEAD` = `e554bfe86bf9...`; `git log --oneline -10` no incluye commits de la feature pendiente (los 3 de la feature ya estaban commiteados, previos a HEAD) |
| A3 | Endpoint `GET /tenants/me` con `@Roles('admin','barber')` + `@CurrentUser('tenantId')` | ADR-017 §1 | [✓] | `tenant.controller.ts:33` `@Get('me')`, `:34` `@Roles('admin', 'barber')`, `:39` `findMyTenant(@CurrentUser('tenantId') tenantId?: string)`; guards de clase `:15` (`JwtAuthGuard, RolesGuard`). Coherente con ADR-012/013 (tenantId solo del JWT) |
| A4 | `MyTenantResponseDto { id, name }` con `@ApiProperty` | ADR-017 §1 | [✓] | `my-tenant-response.dto.ts:3-9` — `@ApiProperty()` en `:4` (id) y `:7` (name) |
| A5 | `findMyTenant` lanza `EntityNotFoundException` + logging | ADR-017 §1 | [✓] | `tenant.service.ts:76-83` — throw en `:79`, `this.logger.log` en `:81`. Mismo patrón que `findById` (`:72-74`) |
| A6 | Pruebas backend éxito + excepción | ADR-017 §1 | [✓] | `tenant.service.spec.ts:161-178` + ejecución real: `npx jest tenant.service.spec.ts` → **15/15 passed** (incl. `findMyTenant` éxito y excepción) |
| A7 | Interfaz `findMyTenant(tenantId: string): Promise<Tenant>` | ADR-017 §1 | [✓] | `tenants-service.interface.ts:10` |
| A8 | Tipo `MyTenant { id, name }` | ADR-017 §2 | [✓] | `frontend/src/types/tenant.ts:3-6` |
| A9 | Servicio `getMyTenant()` → `api.get("/tenants/me")` | ADR-017 §2 | [✓] | `frontend/src/services/tenants.service.ts:4-7` |
| A10 | Hook: guards sin tenantId, refetch mount/focus, cleanup, error silencioso | ADR-017 §3 | [✓] | `use-tenant-name.ts:12` y `:26` `if (!tenantId) return`; `:25-42` useEffect con `visibilitychange`/`focus`; cleanup `:38-41`; catch silencioso `:18-19`. Test file `use-tenant-name.test.tsx` cubre los 5 casos |
| A11 | Skeleton mientras carga, oculto en error | ADR-017 §4 | [✓] | `dashboard-shell.tsx:126-132` — `tenantLoading ? <Skeleton/> : tenantError \|\| !tenantName ? null : <span/>` |
| A12 | modules.md: `/v1/tenants/me` + `getMyTenant`/`use-tenant-name`/`MyTenant` | ADR-017 «Impacto en .docs» | [✓] | diff `modules.md` +39-40 (endpoint) y +258-260 (services/hooks/types); rutas reales coinciden |
| A13 | mvp-scope.md: 3 checkboxes `[x]` | ADR-017 «Impacto en .docs» | [✓] | diff `mvp-scope.md`: sección «Nombre del tenant en el dashboard» con 3 ítems `[x]` |
| A14 | Hashes `80d3bf6`/`3708c7e`/`e554bfe` en changelog | changelog 2026.md | [✓] | `git show --stat` de los 3: `80d3bf6` = backend (5 archivos, 55 ins), `3708c7e` = `tenants.service.ts`+`tenant.ts`, `e554bfe` = `use-tenant-name.ts`+test. Corresponde exactamente a la entrada del changelog (+4) |
| A15 | Sin contrato existente modificado ni migración de DB | ADR-017 «Impacto en código» | [✓] | Los 3 commits son aditivos (solo `3708c7e` con 1 del: import reescrito en `tenants.service.ts`); `backend/src/migrations` sin diff; `/auth/me`, `GET /tenants/:id`, RBAC intactos |
| A16 | `my-tenant-response.dto.ts` listado como nuevo | ADR-017 §1 | [✓] | `git show --name-status 80d3bf6` → `A backend/.../dto/my-tenant-response.dto.ts` |
| A17 | Super-admin sin fetch (sin tenantId) | ADR-017 §3/§4 | [✓] | Hook: `use-tenant-name.ts:12` `if (!tenantId) return`; Shell: `dashboard-shell.tsx:124` `user?.tenantId &&`; test `:27-31` «does not fetch when tenantId is missing» |
| A18 | Diff pendiente `dashboard-shell.tsx` correcto y consistente con ADR-017 §4 | ADR-017 §4 | [✓] | Diff íntegro revisado: imports usados (sin huérfanos), hook llamado con `user?.tenantId`, bloque anidado correcto, colapsado no renderiza (dentro de `!isCollapsed`), estilo `truncate text-xs text-sidebar-foreground` según §4, sin tocar nav/header |
| A19 | Typecheck frontend con diff pendiente | — | [✓] | `npx tsc --noEmit` → **EXIT=0** (re-ejecutado por Auditor) |
| A20 | Suite frontend completa | — | [!] | `npx jest --coverage=false` → **1 failed, 7 passed, 8 total; 4 failed, 35 passed, 39 total**. Único fallo: `admin/services/page.test.tsx` (ver A-FALLA-1 / OBS-1) |
| A21 | Documentación no contradice ADR-015/016 (landing) | ADR-015/016 | [✓] | ADR-017 opera sobre `DashboardShell` (sidebar de dashboards); ADR-015/016 operan sobre la landing pública `/[slug]`. Sin solapamiento de contratos ni de componentes |
| A22 | Documentación del Architect precisa y refleja el estado real | ADR-017 | [✓] | ADR-017, modules.md, mvp-scope.md y changelog describen exactamente lo implementado (endpoint, DTO, servicio, hook, integración). Nota cosmética en `modules.md:39-40` (ver OBS-2) |

## 2. Detalle de hallazgos

**A-FALLA-1 — OBS-1 del Executor VERIFICADO COMO PREEXISTENTE (BAJA, no bloquea).**
- Síntoma: 4 tests fallan en `admin/services/page.test.tsx` — `Base UI: useToastManager must be used within <Toast.Provider>` (`page.tsx:37`).
- Verificación independiente del Auditor: se creó worktree limpio en HEAD `e554bfe` (`/tmp/opencode/tf-head-audit`, node_modules symlink) y se ejecutó el test → **resultado idéntico: 1 failed / 4 failed**. El fallo existe sin el diff pendiente.
- El test no depende de la feature: no importa `DashboardShell`, `use-tenant-name`, `tenants.service` ni `MyTenant`. El último commit que tocó el archivo es `82c9674` (commit inicial del monorepo), muy anterior a la feature.
- Dictamen: **preexistente y ajeno al cambio pendiente → BAJA, no bloquea la aprobación.**

**OBS-2 — Nota cosmética en modules.md (BAJA, sin impacto).** La anotación del endpoint (`modules.md:39-40`) se insertó como línea de comentario dentro del árbol ASCII bajo `tenants/`. Es legible y factual, pero rompe levemente la alineación visual del diagrama. No es una falla de documentación de contenido.

**OBS-3 — Refetch en focus re-muestra Skeleton brevemente.** En cada retorno al foco/visibilidad, `loading` vuelve a `true` (`use-tenant-name.ts:13`) y el Skeleton reaparece bajo el brand label por una fracción de segundo. Comportamiento aceptado y coherente con ADR-017 §4 (Skeleton mientras carga); es una nota de UX, no una falla.

## 3. Resumen ejecutivo

- **Total de criterios auditados:** 22
- **Aprobados [✓]:** 21
- **Con observación [!]:** 1 (A20 — suite frontend, fallo preexistente y ajeno, BAJA)
- **Fallidos [✗]:** 0
- **Severidad de hallazgos:** 0 CRÍTICA / 0 ALTA / 0 MEDIA / 2 BAJA (A-FALLA-1 verificado preexistente; OBS-2 cosmética). Sin deuda introducida por el cambio.

## 4. Veredicto global

**APROBADO CON OBSERVACIONES**

- Matriz 3.1–3.15 re-validada con evidencia propia: 15/15 claims correctos.
- Diff pendiente de `dashboard-shell.tsx` correcto, no rompe nada y es consistente con ADR-017 §4.
- Documentación (ADR-017, modules.md, mvp-scope.md, changelog) precisa y sin contradicciones con ADR-015/016.
- OBS-1 del Executor confirmado como **preexistente** (verificado en worktree limpio de HEAD) → no bloquea.
- Working tree íntegro (5 paths + reporte), HEAD intacto `e554bfe`, sin commits nuevos.
- El commit queda autorizado como siguiente paso (post-aprobación, restricción del programador respetada).

## 5. Deuda técnica identificada

1. **`admin/services/page.test.tsx` sin `<Toast.Provider>`** (A-FALLA-1): 4 tests muertos desde el commit inicial (`82c9674`). Preexistente, ajeno a la feature. Recomendación: envolver los renders en `<Toast.Provider>` en un ticket de QA separado y re-habilitar la suite al 100%.
2. **`modules.md` anotación en árbol ASCII** (OBS-2): trivial; puede reformatearse en el próximo toque de documentación.
3. **Skeleton en refetch de focus** (OBS-3): UX menor; si molesta, puede omitirse el Skeleton cuando ya hay `tenantName` en memoria (solo actualizar el texto). No es necesario.