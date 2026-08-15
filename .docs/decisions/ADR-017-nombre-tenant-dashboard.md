# ADR-017: Nombre del tenant en el dashboard (sidebar)

**Estado:** ACEPTADO
**Fecha:** 2026-08-15

**Contexto:**
Los tres dashboards internos (admin, barber, super-admin) comparten el layout `DashboardShell`, cuyo sidebar muestra un **brand label genérico** (`TRIMFLOW`, o `SUPER` para super-admin). El usuario autenticado que opera dentro de una barbería no puede ver a qué tenant pertenece su sesión: no hay ninguna indicación de identidad de negocio en la interfaz, a pesar de que el token JWT ya transporta el `tenantId` del usuario.

Se requiere mostrar el **nombre real del tenant** de la sesión bajo el brand label, de forma discreta y solo cuando exista `tenantId` en el usuario autenticado (admin y barber; el super-admin no pertenece a ningún tenant y su sidebar conserva `SUPER`).

El problema se resuelve de forma explícita y acotada:
- El frontend no posee el nombre del tenant en memoria (el payload `User` de `/auth/me` expone `tenantId`, pero no `name`).
- El endpoint de tenants existente (`GET /tenants/:id`) está restringido a `super-admin` y devuelve la entidad completa, no es apropiado para consultar el propio tenant.

## Decisión

Añadir un endpoint **self-service** de tenants, `GET /v1/tenants/me`, escopado por el `tenantId` del token, y un hook frontend `useTenantName` que lo consume con refetch en mount y en focus. El nombre se renderiza en el sidebar de `DashboardShell` bajo el brand label, con Skeleton mientras carga y oculto ante error o ausencia de `tenantId`.

### 1. Backend: endpoint `GET /v1/tenants/me` (scoped por token)

En `backend/src/modules/tenants/`:

- **Controller** (`tenant.controller.ts`): `GET /tenants/me` con `@Roles('admin', 'barber')` bajo `JwtAuthGuard` + `RolesGuard`. Toma el `tenantId` del token vía `@CurrentUser('tenantId')` (nunca del body ni de la URL, coherente con el aislamiento multi-tenant de ADR-013/ADR-012). Devuelve `MyTenantResponseDto { id, name }`.
- **Servicio** (`tenant.service.ts`): nuevo método `findMyTenant(tenantId)` que resuelve el tenant por id y lanza `EntityNotFoundException` si no existe (mismo patrón que `findById`), con logging operacional.
- **Interfaz** (`tenants-service.interface.ts`): `findMyTenant(tenantId: string): Promise<Tenant>`.
- **DTO** (`my-tenant-response.dto.ts`): `MyTenantResponseDto { id: string, name: string }` con `@ApiProperty` (Swagger).
- **Pruebas** (`tenant.service.spec.ts`): casos de éxito y de `EntityNotFoundException`.

El endpoint es seguro por diseño: un admin/barber solo puede leer el nombre de **su propio** tenant; el `tenantId` proviene exclusivamente del JWT validado.

### 2. Frontend: tipo `MyTenant` + servicio `getMyTenant`

- **Tipo** (`frontend/src/types/tenant.ts`): `interface MyTenant { id: string; name: string }`.
- **Servicio** (`frontend/src/services/tenants.service.ts`): `getMyTenant(): Promise<MyTenant>` que llama a `api.get("/tenants/me")` (cliente axios con token).

### 3. Frontend: hook `useTenantName` con refetch en mount y focus

En `frontend/src/hooks/use-tenant-name.ts`:

- Firma `useTenantName(tenantId?: string)` → `{ tenantName, loading, error }`.
- Si `tenantId` no existe, **no dispara ninguna petición** (el super-admin no hace fetch).
- En **mount** (`useEffect`) ejecuta `getMyTenant()` y actualiza `tenantName`.
- **Refetch en focus**: escucha `visibilitychange` (tab visible) y `focus` de ventana; re-valida el nombre al volver a la app. Los listeners se limpian al desmontar (sin fugas).
- Manejo de error silencioso: ante fallo, `error` se setea y `tenantName` permanece `null`; la UI simplemente no muestra el nombre (sin bloqueo del dashboard).

### 4. Integración en `DashboardShell`

En `frontend/src/components/layouts/dashboard-shell.tsx` (cambio sin commitear):

- El sidebar muestra el `brandLabel` (`TRIMFLOW` / `SUPER`) y, **solo si `user?.tenantId` existe**, el nombre del tenant debajo:
  - `tenantLoading` → `<Skeleton>` (shadcn) mientras carga.
  - `tenantError` o sin `tenantName` → no se renderiza nada (error silencioso).
  - éxito → `<span>` con `truncate` para el nombre (discreto, `text-xs`, `text-sidebar-foreground`).
- En modo colapsado no se muestra (igual que el brand label, solo cabecera con inicial).

## Alternativas consideradas

| Alternativa | Razón para descartar |
|---|---|
| **(a) Incluir `tenant.name` en el payload de `/auth/me`** | Modifica un contrato central de auth ya establecido; obligaría a re-validar el token/refresh en cada sesión y duplicaría la lógica de resolución del tenant en el módulo auth (rompería la cohesión del módulo `tenants`). |
| **(b) Reusar `GET /tenants/:id` desde el frontend** | El endpoint está restringido a `super-admin`; un admin/barber no tiene permiso, y además expone la entidad `Tenant` completa (datos internos). Exponerlo a otros roles rompería RBAC. |
| **(c) Derivar el nombre de `user.name` u otro campo del frontend** | `user.name` es el nombre de la persona, no del negocio; no existe el dato del tenant en el frontend sin petición. |
| **(d) Cachear el tenant en contexto global (estado global)** | Overkill para un único string de identidad; el refetch en mount/focus es suficiente y no añade complejidad de estado compartido. |

## Consecuencias

### Positivas
- **Identidad de negocio visible**: el usuario sabe en qué barbería está operando, sin salir del dashboard.
- **Aislamiento multi-tenant reforzado**: el endpoint se escopa por `tenantId` del token; es imposible leer el nombre de otro tenant.
- **RBAC intacto**: `GET /tenants/me` se abre solo a `admin`/`barber`; el resto de endpoints de tenants sigue restringido a `super-admin`.
- **Costo bajo y desacoplado**: una petición ligera (`{ id, name }`), un DTO dedicado, sin tocar auth ni el contrato de `/auth/me`.
- **Sin bloqueo de la UI**: el dashboard no depende de este fetch; el error es silencioso y el nombre es opcional.

### Negativas
- **Una petición extra por sesión** (además de `/auth/me`), repetida en cada mount del layout y en cada retorno al foco/visibilidad de la pestaña.
- **El nombre solo se muestra si existe `tenantId`**: el super-admin no lo ve (correcto por diseño, pero el dato queda "incompleto" en ese rol).
- **Manejo de error silencioso**: si el endpoint falla, el usuario no ve el nombre y no hay feedback explícito del fallo (aceptado para no interrumpir el dashboard).
- **Refetch en focus no invalidado por datos**: si el tenant se renombra (edición super-admin), el nombre se actualiza solo al volver a la pestaña o recargar, no en tiempo real.

## Impacto en .docs

- **`decisions/ADR-017-nombre-tenant-dashboard.md`** (este documento): decisión del endpoint self-service `/v1/tenants/me` + hook `useTenantName` + integración en `DashboardShell`.
- **`architecture/modules.md`**: actualizar el paralelo frontend (`services/tenants.service.ts` con `getMyTenant`, `hooks/use-tenant-name.ts`, nota del endpoint `/v1/tenants/me` en el módulo `tenants`).
- **`requirements/mvp-scope.md`**: marcar la identidad del tenant en el dashboard como parte del alcance MVP.
- **`changelog/2026.md`**: nueva entrada con fecha 2026-08-15 y referencia a ADR-017.

## Impacto en código

- **Backend** (`backend/src/modules/tenants/`):
  - `controllers/tenant.controller.ts` — endpoint `GET /tenants/me` (roles `admin`, `barber`, scoped por token).
  - `dto/my-tenant-response.dto.ts` — **nuevo** `MyTenantResponseDto { id, name }`.
  - `interfaces/tenants-service.interface.ts` — método `findMyTenant`.
  - `services/tenant.service.ts` — implementación de `findMyTenant` (+ `EntityNotFoundException`).
  - `services/tenant.service.spec.ts` — pruebas del nuevo método.
- **Frontend**:
  - `frontend/src/types/tenant.ts` — **nuevo** tipo `MyTenant`.
  - `frontend/src/services/tenants.service.ts` — **nuevo** `getMyTenant()`.
  - `frontend/src/hooks/use-tenant-name.ts` — **nuevo** hook con refetch en mount/focus.
  - `frontend/src/hooks/__tests__/use-tenant-name.test.tsx` — **nuevo** set de pruebas.
  - `frontend/src/components/layouts/dashboard-shell.tsx` — integración en el sidebar (Skeleton / oculto en error).
- No se modifica ningún contrato existente (`/auth/me`, `GET /tenants/:id`, RBAC) ni se añade migración de DB.