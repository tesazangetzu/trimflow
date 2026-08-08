# ADR-013: Personalización de la landing pública por tenant (panel admin)

**Estado:** ACEPTADO
**Fecha:** 2026-08-05

**Contexto:**
La landing pública de reservas (ADR-012) se sirve por `/[slug]` con una estética urbana/street fija (paleta asphalt/neon, fuentes Archivo + Space Grotesk). Para que cada barbería pueda diferenciarse, se requiere que el **Administrador** personalice su landing desde el dashboard, sin tocar los dashboards internos ni alterar el consumo público.

Requisitos funcionales del panel admin (`/admin/landing`):

1. Editar **presentación** (eslogan, título/subtítulo del hero, items de la marquesina/ticker).
2. Editar **marca e imágenes** (URL del logo, URL de imagen del hero) con guías de proporción.
3. Editar la **paleta de colores** (6 tokens de tema urbano/street).
4. Editar la **tipografía** (fuente display y body).
5. Activar/desactivar **secciones visibles** (servicios, barbers, horarios, ubicación, reserva).
6. Acciones: "Restaurar default" y "Ver mi landing" (abre `/[slug]`).
7. La personalización debe ser **por tenant**: cada barbería edita solo su propia landing.

La persistencia debe integrarse con el modelo multi-tenant existente (cada entidad pertenece a un `Tenant`, ver PROJECT.md). `Tenant` ya tiene un campo `settings` tipo JSONB (existente en Tenants/Settings), que es el lugar natural sin nueva tabla.

## Decisión

### 1. Persistencia de la config en `Tenant.settings.landing` (JSONB) + defaults fusionados

La configuración de la landing del tenant se guarda como objeto `landing` dentro de `Tenant.settings` (JSONB). No se crea tabla dedicada.

- **Defaults de esquema:** se define `LANDING_DEFAULTS` (interfaces `LandingConfig`, `LandingPalette`, `LandingTypography`, `LandingBranding`, `LandingPresentation`, `LandingSections`) como contrato canónico del esquema completo.
- **Merge defensivo:** la config guardada (parcial o ausente) se fusiona sobre los defaults con `mergeLandingConfig` (fusión profunda por clave, ignorando objetos no-registrados/no-válidos). Todo consumo devuelve SIEMPRE un `LandingConfig` completo y válido, invisibles para valores nulos o formas inesperadas.
- El frontend mantiene un **espejo tipográfico** de estas interfaces, `frontend/src/types/landing.ts`, más `LANDING_DEFAULTS` e `IMAGE_GUIDES` (proporciones recomendadas de logo/hero).

Estética por defecto: urbana/street (paleta asphalt/concrete/smoke/bone/neon/blood, fuentes Archivo (display) y Space Grotesk (body)).

### 2. Endpoints `/landing` (GET/PUT) protegidos, escopados por tenant

Se añade el módulo backend `landing/` con el controlador `LandingController`:

```
GET /v1/landing            → { slug, config }  (config completa: defaults actualizados + guardados)
PUT /v1/landing            → config completa   (actualización PARCIAL vía DTO con class-validator)
```

- **Auth/RBAC:** ambos endpoints usan `@JwtAuthGuard` + `@RolesGuard` con `@Roles('admin')` (rol Administrador). Coherente con ADR-003/RBAC y PROJECT.md.
- **Aislamiento multi-tenant:** el `tenantId` se toma del `@CurrentUser('tenantId')` (otorgado por el token JWT), NO del body ni de la URL. Cada admin solo lee/escribe la landing de su tenant; es imposible tocar la de otra barbería. La actualización aplica el merge sobre `tenant.settings.landing` y persiste con `TenantRepository.save`.
- **Validación:** `UpdateLandingConfigDto` es parcial (`@IsOptional` en todo), con `ValidateNested`/`@Type`. Paleta validada con `@IsHexColor`, strings con `@MaxLength`, `tickerItems` como `string[]`.
- **Logging:** `LandingService` registra la actualización de config por tenant con `TrimflowLoggerService`.

### 3. Alcance de la config: SOLO la landing pública `/[slug]`

La config NUNCA afecta a los dashboards (admin/barber/super-admin). El aislamiento se logra por **CSS variables de scope local**:

- `landingThemeVars(config)` en `frontend/src/components/landing/landing-theme.ts` convierte la config en variables `--landing-*` (`--landing-bg/surface/muted/fg/accent/danger`, `--landing-font-display/body`) que se inyectan **solo en el wrapper de `/[slug]`**.
- Fuentes **Archivo**, **Space Grotesk** (y **Poppins** para dashboards) se cargan vía `next/font` en el layout raíz (`--font-archivo`, `--font-space-grotesk`, `--font-poppins`); el mapeo de `LandingTypography` a la variable de fuente se hace con `fontFamily()`.
- Los dashboards conservan su tema temporal global (ADR-007). La keyframe `landing-marquee` (ticker) vive en `globals.css` y solo se aplica en la landing.

### 4. Panel admin `/admin/landing`

- Nueva página `frontend/src/app/(dashboard)/admin/landing/page.tsx` (cliente), con entrada "Landing" en `ADMIN_NAV` (`nav-config.tsx`, sección `others`, icono Palette).
- Consume `GET /v1/landing` y `PUT /v1/landing` vía `landing.service.ts` del frontend (`getConfig`/`updateConfig`).
- Edita presentación, marca/imágenes (con vistas previas de logo/hero y `IMAGE_GUIDES`), paleta (color pickers), tipografía y secciones visibles (toggles). "Restaurar default" lleva el form a `LANDING_DEFAULTS`; "Ver mi landing" abre `/{slug}`.
- El guardado envía la config completa en una sola `PUT` (parcial a nivel de servicio gracias al DTO).

### 5. Inyección pública: `PublicShop.landing`

El payload público de la landing, `GET /v1/public/:slug`, devuelve `landing: mergeLandingConfig(tenant.settings.landing)` dentro de `PublicShop` (tipo `PublicShop.landing: LandingConfig`). `LandingPage` consume `shop.landing ?? LANDING_DEFAULTS`, con la estética decidida por `landing-theme.ts`. `BookingWizard` acepta una prop opcional `shop` (para reutilizar los datos ya cargados por la landing en vez de refetch).

## Consecuencias

### Positivas
- **Personalización real por tenant** con costo mínimo de modelo: no hay nueva tabla ni migración (se reutiliza `Tenant.settings` JSONB).
- **Aislamiento reforzado**: la config se lee/escribe acotada al `tenantId` del token; el consumo público opcional se resuelve por slug de la propia barbería.
- **Tema aislado por CSS vars**: los dashboards no se ven afectados; la personalización es inofensiva para ADR-007.
- **Merge defensivo** garantiza que los datos parciales o malformados no rompen la landing (siempre defaults).
- Contrato privado delgado y reutilizable por el panel; el frontend espeja el tipado.

### Negativas
- La config guardada introduce un objeto JSONB nuevo con forma no estrictamente tipada en BD: la validación se delega al DTO y al merge mid-validando (falta de garantía de esquema en el almacén).
- Las fuentes se cargan globalmente con `next/font` (aunque solo se usan en `/[slug]`); el panel depende de esta distribución de variables.
- Validar la paleta con `@IsHexColor` restringe a hex (descarta la edición por HSL/RGB en MVP).

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Tabla dedicada de config de landing (p.ej. `landing_configs`)** | Sobre-ingeniería: la config es un bloque único por tenant ya cubierto por `Tenant.settings` JSONB; una tabla añade migración, FK y más código sin beneficio de consulta (la landing se lee como bloque junto al tenant). |
| **Tema global para la landing** | Contaminaría los dashboards (ADR-007): la personalización debe quedar confinada a `/[slug]`. Las CSS variables de scope local aíslan el tema. |
| **Endpoints de personalización reutilizando `/v1/public`** | La landing pública es sin JWT (ADR-012) y no debe exponer un endpoint de escritura configurable sin auth; el panel es admin y protegido. Endpoints `/landing` separados mantienen la separación pública/privada y el aislamiento por token. |
| **Guardar config parcial sin defaults completados** | Riesgo de config malformada que rompa el frontend. Se prefiere siempre devolver una config fusionada/completa. |

## Impacto en .docs

- `decisions/ADR-012-landing-publica-reservas.md`: ADR previo que documentara la landing pública y `/v1/public`; este ADR extiende el consumo con la personalización por tenant.
- `architecture/modules.md`: agregar el módulo backend `landing/` y el panel frontend `/admin/landing`.
- `requirements/mvp-scope.md`: reflejar el panel de personalización de la landing como parte del alcance MVP.
- `api/versioning.md`: no cambiar (no hay contratos por módulo en este repo); los endpoints GET/PUT `/v1/landing` quedan documentados en este ADR.
- `changelog/2026.md`: nueva entrada de fecha 2026-08-05 (ver archivo de cambios).

## Impacto en código

- **Backend** (`backend/src/modules/landing/`): `landing-config.ts` (interfaces + `LANDING_DEFAULTS` + `mergeLandingConfig`), `landing.module.ts`, `controllers/landing.controller.ts` (GET/PUT protegidos JWT+RBAC admin), `services/landing.service.ts` (persistencia en `Tenant.settings.landing`), `dto/update-landing-config.dto.ts` (DTO parcial). Se registra `LandingModule` en `app.module.ts`.
- **Frontend**: `types/landing.ts`, `services/landing.service.ts`, página `app/(dashboard)/admin/landing/page.tsx`, ítem "Landing" en `components/layouts/nav-config.tsx`, consumo en `components/landing/*` (LandingPage/Hero/Sections + `landing-theme.ts`), tipos `types/public.ts` (`PublicShop.landing`), página `app/[slug]/page.tsx` y `components/booking/BookingWizard.tsx` (prop `shop`), fuentes Archivo/Space Grotesk en `app/layout.tsx`, keyframes `landing-marquee` en `app/globals.css`.
- No se requiere migración de DB (reutiliza `Tenant.settings` JSONB).

---

## Actualización 2026-08-07

Los **valores por defecto** de la paleta y la tipografía de la landing cambiaron con la nueva identidad visual (`LANDING_DEFAULTS` y su espejo frontend `types/landing.ts`: nueva paleta marfil/tan/tinta/oxblood y fuentes Marcellus/Spectral/IBM Plex Mono). Ver **ADR-014**.

El **mecanismo de ADR-013 permanece intacto**: la personalización sigue persistiendo en `Tenant.settings.landing` (JSONB) y fusionándose sobre los nuevos defaults con `mergeLandingConfig`; la estética sigue aislándose a `/[slug]` por CSS variables de scope local vía `landingThemeVars`. Los tenants con config guardada **conservan su paleta/fuentes** hasta pulsar "Restaurar default" en `/admin/landing` (entonces heredan la nueva identidad). Sin cambios de contrato API ni migración de DB.