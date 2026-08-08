# Contexto para Architect-agent — ADR-015 (identidad dark luxury)

TRIGGER=ORCHESTRATOR MODE=MANUAL

Actúas como el **Architect-agent** de TrimFlow. El Orquestador te invoca porque el programador aprobó la **Opción A**: documentar una NUEVA identidad visual de la landing pública como **ADR-015** antes de implementarla.

## Tu rol

Genera y escribe la documentación arquitectónica necesaria en `.docs/` para la nueva identidad **dark luxury / barbershop premium** de la landing pública `/[slug]`. NO escribas código de la aplicación. Tu entregable es documentación en `.docs/`.

## Contexto del proyecto (ya explorado por el Orquestador)

- Monorepo TrimFlow: `backend/` (NestJS) + `frontend/` (Next.js 16.2.12 App Router, React 19, Tailwind v4, shadcn).
- La landing pública se sirve en `/[slug]` (p.ej. `/barberia-el-clasico`), multi-tenant, datos de `GET /v1/public/:slug` (PublicShop: name, email, landing, branches con barbers/services).
- El formulario de reserva vive en `/[slug]/reservar` reutilizando `BookingWizard` (ADR-012). NO se toca la lógica de reservas.
- La personalización por tenant se persiste en `Tenant.settings.landing` (JSONB) y se fusiona sobre `LANDING_DEFAULTS` con `mergeLandingConfig` (ADR-013). La estética se aísla a `/[slug]` por CSS variables de scope local vía `landingThemeVars(config)` en `frontend/src/components/landing/landing-theme.ts`.
- La identidad ACTUAL (ADR-014, ya implementada) es «Umbral de tinta + libro de cuentas»: paleta marfil/tan/tinta/oxblood (tema claro), fuentes Marcellus/Spectral/IBM Plex Mono, barber-pole como firma visual, animaciones gated por prefers-reduced-motion.
- El programador quiere reemplazar esa identidad por **dark luxury**: fondo negro/negro carbón, dorado como acento, tipografía elegante para títulos, fotografías grandes, mucho contraste, tarjetas refinadas, bordes dorados con moderación, animaciones sutiles, excelente mobile, CTA de reserva siempre visible.

## Archivos clave que debes leer para documentar con precisión

- `.docs/decisions/ADR-012-landing-publica-reservas.md` (flujo público + separación a /[slug]/reservar)
- `.docs/decisions/ADR-013-personalizacion-landing-publica.md` (mecanismo de config por tenant)
- `.docs/decisions/ADR-014-identidad-visual-landing.md` (identidad actual que se reemplaza)
- `.docs/architecture/modules.md` (paralelo estructural frontend/backend)
- `.docs/changelog/2026.md` (formato de entradas)
- `backend/src/modules/landing/landing-config.ts` (LANDING_DEFAULTS backend)
- `frontend/src/types/landing.ts` (espejo frontend + LANDING_DEFAULTS + IMAGE_GUIDES)
- `frontend/src/components/landing/landing-theme.ts` (landingThemeVars)
- `frontend/src/app/layout.tsx` (carga de fuentes next/font)
- `frontend/src/app/globals.css` (estilos landing: strop, pole, reveal, marquee)
- `frontend/src/components/landing/LandingPage.tsx`, `LandingHero.tsx`, `LandingNav.tsx`, `LandingSections.tsx`, `LandingCTA.tsx`, `LandingState.tsx`, `Reveal.tsx`
- `frontend/src/components/booking/ReservationPage.tsx` (WIZARD_TOKENS scoped)

## Decisión a documentar (ADR-015)

Nueva identidad visual **dark luxury / barbershop premium** para la landing pública `/[slug]`:

1. **Paleta**: fondo negro/negro carbón (p.ej. #0A0A0A / #111111), superficies gris carbón, texto marfil/claro, acento **dorado** (p.ej. #C9A227 / #D4AF37), danger rojo oscuro. Mapear sobre los MISMOS 6 tokens `--landing-*` del esquema ADR-013 (asphalt/concrete/smoke/bone/neon/blood) para no migrar el esquema.
2. **Tipografía**: display elegante (p.ej. Marcellus o Playfair Display), body serif legible (Spectral), utility mono (IBM Plex Mono). Decidir si se mantienen las fuentes actuales o se cambian; documentar la decisión.
3. **Hero**: banda oscura con imagen de fondo velada + overlay, título grande, CTA dorado primario + CTA outline secundario, indicador de scroll, marquesina reskin.
4. **Secciones**: Servicios (tarjetas premium con imagen/duración/precio/descripción/indicador "MÁS ELEGIDO"/botón RESERVAR), Barberos (foto circular o iniciales, nombre, especialidad si existe, botón RESERVAR), Galería (grid/masonry, capa frontend preparada para futura config), Stats (datos configurables, NO inventar cifras), Ubicación+Horarios (datos existentes), Footer (dinámico).
5. **Navbar**: transparente inicialmente, fondo oscuro semitransparente al scroll, anchors, CTA "Reservar cita", hamburguesa en mobile.
6. **Animaciones**: fade/slide al entrar en viewport, hover de tarjetas, transición navbar, microinteracciones, gated por prefers-reduced-motion. Sin dependencias pesadas.
7. **Mobile-first**: 360/390/414px, sin overflow, botones touch-friendly, CTA prominente.
8. **Multi-tenancy**: el diseño debe ser el nuevo default (LANDING_DEFAULTS) y seguir siendo reutilizable; los tenants con config guardada conservan su paleta hasta "Restaurar default" (mecanismo ADR-013 intacto). El diseño debe poder evolucionar hacia múltiples temas.

## Restricciones

- NO tocar backend de reservas, auth, appointments, schedule, disponibilidad, API pública.
- NO inventar datos (dirección, teléfono, horarios, cifras de stats, barberos, redes sociales).
- NO introducir sistema de almacenamiento de imágenes nuevo; reutilizar el mecanismo actual (branding.logoUrl / heroImageUrl) y dejar preparada la estructura para futura personalización.
- La documentación debe ser coherente con ADR-012/013/014 y actualizar: ADR-015 (nuevo), enmiendas a ADR-013/014 si procede, `architecture/modules.md`, `changelog/2026.md`, `requirements/mvp-scope.md` si procede.

## Entregables

1. `.docs/decisions/ADR-015-identidad-dark-luxury-landing.md` (nuevo, formato consistente con los ADR existentes: Contexto, Decisión, Alternativas consideradas, Consecuencias, Impacto en .docs, Impacto en código).
2. Enmiendas necesarias en ADR-013/014 (sección "Actualización" al final, como ya se hace en el repo).
3. Actualización de `.docs/architecture/modules.md` (paralelo estructural si cambia la estructura de componentes).
4. Entrada en `.docs/changelog/2026.md`.
5. Un resumen final (en tu mensaje de respuesta) con: decisiones tomadas, archivos de .docs modificados/creados, y las implicaciones exactas para el Planner/Executor (qué defaults de paleta/tipografía usar, qué componentes rediseñar, qué tokens mapear).

## Formato de respuesta

Devuelve un resumen estructurado con:
- Lista de archivos .docs creados/modificados
- La paleta exacta propuesta (6 tokens hex)
- La tipografía propuesta (display/body/mono)
- Los componentes frontend afectados
- Cualquier decisión que el Planner/Executor deba respetar