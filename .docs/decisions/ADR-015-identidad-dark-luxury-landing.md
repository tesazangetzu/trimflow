# ADR-015: Nueva identidad visual «Dark Luxury» de la landing pública

**Estado:** ACEPTADO
**Fecha:** 2026-08-08

**Contexto:**
La landing pública `/[slug]` adopta actualmente la identidad «Umbral de tinta + libro de cuentas» (ADR-014, ya implementada): paleta clara marfil/tan/tinta/oxblood, fuentes Marcellus/Spectral/IBM Plex Mono y la barber-pole como firma visual. El programador aprueba **reemplazarla** por una dirección **dark luxury / barbershop premium**: fondo negro/negro carbón, acento dorado, tipografía elegante para títulos, fotografía grande, alto contraste, tarjetas refinadas con bordes dorados sutiles, animaciones discretas, excelente experiencia mobile y un CTA de reserva siempre visible.

Este ADR se documenta **antes** de implementar (Opción A del Orquestador): fija la decisión para que Planner/Executor la implementen después, coherente con la cadena ADR-012 → ADR-013 → ADR-014 → ADR-015.

**Premisas que se dan por sentadas (documentadas aquí, no re-diseñadas):**
- El flujo y la estructura de la landing (ADRs 012/013/014): reserva en `/[slug]/reservar`, config por tenant en `Tenant.settings.landing` (JSONB) fusionada sobre `LANDING_DEFAULTS`, estética aislada a `/[slug]` por CSS variables de scope local (`landingThemeVars`).
- **NO se toca** la lógica de reservas (`BookingWizard` en `/[slug]/reservar`, endpoints `/v1/public/:slug`).
- **NO se introducen datos inventados**: el payload público (`PublicShop`, ver `types/public.ts`) solo expone name/email, branches con address/phone/openingTime/closingTime, y por branch `services` (id, name, description, price, durationMinutes) y `barbers` (id, name). No hay imágenes de servicio, fotos/especialidades de barbero, campo "popular", cifras de stats ni colección de galería.
- **NO se introduce sistema de almacenamiento de imágenes nuevo**: se sigue usando `LandingBranding.logoUrl` / `heroImageUrl` (URLs) como hoy.
- La investigación de color 2026 (restraint, máx. 4 colores simultáneos, sin neón ni amarillo brillante) sigue vigente: **dark luxury la cumple** (2 negros + 1 marfil + 1 dorado).

## Decisión

Nueva identidad visual **dark luxury** para la landing pública `/[slug]` como **default de serie** (`LANDING_DEFAULTS`), mapeada sobre los **mismos 6 tokens `--landing-*`** del esquema ADR-013 (asphalt/concrete/smoke/bone/neon/blood) para **no migrar el esquema**, la persistencia ni el panel admin.

### 1. Paleta (remapea el rol de los 6 tokens hacia dark; mismo esquema)

La clave del token no cambia; cambia el hex y el rol semántico sobre fondo oscuro:

| Clave `--landing-*` | Hex | Rol en dark luxury |
|---|---|---|
| `--landing-bg` (asphalt) | `#0A0A0A` | Fondo base negro carbón |
| `--landing-surface` (concrete) | `#111111` | Superficie / tarjetas gris carbón |
| `--landing-fg` (bone) | `#F2EDE4` | Texto principal marfil claro |
| `--landing-muted` (smoke) | `#8A8178` | Texto secundario gris taupe claro (armoniza con el dorado) |
| `--landing-accent` (neon) | `#C9A227` | Acento dorado old-gold (CTAs, kickers, hairline, indicadores) |
| `--landing-danger` (blood) | `#C0392B` | Alerta / error (rojo ladrillo oscuro) |

- El rol de `neon` pasa de acento oxblood (rol anterior) a **dorado**; el de `bone` de texto oscuro a texto claro: el fondo y el texto **invierten su relación**, pero los 6 tokens y el mecanismo de merge siguen idénticos. Los tenants con config guardada conservan sus hex hasta "Restaurar default" (ADR-013 intacto).
- **Contraste AA (WCAG)**: `#C9A227` sobre `#0A0A0A` ≈ 8:1 (CTAs y texto grande/UI OK); `#8A8178` sobre `#0A0A0A` ≈ 5.2:1 (texto secundario cumple AA). No se usa texto marfil sobre dorado.
- **Hero / bandas oscuras internas**: vars derivadas de la paleta (`--landing-hero-bg` ≈ `#080808`, `--landing-hero-fg` = bone, `--landing-hero-muted` ≈ `#B4A99C`) en lugar de hexes sueltos hardcodeados en componentes.

### 2. Tipografía — SE MANTIENEN las 3 fuentes actuales (decisión explícita)

| Rol | Fuente | Uso |
|---|---|---|
| Display | **Marcellus** | Títulos de sección, hero y CTA en mayúsculas, tracking amplio |
| Body | **Spectral** | Párrafos y descripciones (serif legible premium) |
| Utility | **IBM Plex Mono** | Kickers, precios, horarios, datos — efecto "recibo grabado" sobre oscuro |

Decisión: **no cambiar las fuentes ni la carga `next/font`** en `app/layout.tsx`. Marcellus es una display serif de alto contraste ya pensada para noches de barbería clásica; sobre negro + dorado realza la dirección dark luxury sin necesidad de Playfair Display (ver Alternativas). Beneficio: cero cambios en `layout.tsx`, en el mapeo `fontFamily()` de `landing-theme.ts` y en las opciones del panel admin ("Disponibles: Marcellus, Spectral, Poppins").

### 3. Hero — banda oscura con fotografía + doble CTA

- **Fondo**: banda `--landing-hero-bg` con la imagen de `branding.heroImageUrl` (si existe) como **full-bleed velada** (opacidad moderada ~35-50%) + **scrim** `linear-gradient` hacia `--landing-bg` en los bordes para evitar cortes duros (mismo mecanismo de imagen actual, ningún storage nuevo). Si no hay imagen, banda sólida oscura.
- **Contenido**: kicker/tagline (mono, dorado), logo (`logoUrl`, si existe), **título grande display** en marfil, subtítulo body serif en muted.
- **CTA primario** (dorado, texto oscuro): "Reservar ahora" → `/[slug]/reservar`.
- **CTA secundario `outline`** (nuevo): borde dorado + texto marfil, sin relleno; enlaza al ancla `#servicios` ("Ver servicios" / "Nuestro trabajo") — anclaje interno, no inventa destino.
- **Indicador de scroll**: micro-caret/chevron dorado animado en el borde inferior del hero (oculto con `prefers-reduced-motion`).
- **Marquesina/ticker**: reskin a la paleta dark (texto marfil/surface, separadores dorados `›`); se conserva la keyframe `landing-marquee`.

### 4. Navbar — transparente → oscuro translúcido al scroll + hamburguesa

- Estado inicial **transparente** (sobre el hero); al superar un umbral de scroll (~32-48px) pasa a **fondo oscuro semitranslúcido** (`rgba(10,10,10,0.72)` + `backdrop-blur`).
- Transición suave con CSS (media `prefers-reduced-motion`: sin transición).
- Anchors (Servicios, Equipo, Horarios, Ubicación), **CTA "Reservar cita"** → `/[slug]/reservar`.
- **Hamburguesa en <md** (nuevo): panel desplegable oscuro con los anchors + CTA; accesible (botón con `aria-expanded`/`aria-label`), cierra al hacer click en un enlace o fuera.
- Indicador de sección activa: el motivo de ADR-014 (barber-pole) se **redefine como franja dorada** (ver §8) y se mantiene en los 3 usos originales.

### 5. Secciones

Alternancia de **bandas oscuras** (fondo base ↔ superficie carbón) para separar secciones (en lugar de marfil/tan). Kicker mono dorado + título display + strop con **caret dorado** (cambio de tono sin cambiar la técnica del hairline).

- **Servicios**: tarjetas premium (superficie carbón + hairline dorado a ~40% de opacidad en reposo, borde dorado pleno en hover). Por tarjeta:
  - Icono/ícono caja cuadrada con borde dorado, nombre (display), descripción (body), **duración** y **precio** (mono, dorado), y botón **"RESERVAR"** → `/[slug]/reservar`.
  - Slot de imagen de servicio y franja **"MÁS ELEGIDO"**: **condicionados a un dato que hoy no existe** (`imageUrl` en el payload / flag de popularidad); se prepara el contenedor pero **no se renderiza nada** mientras no exista la fuente (ver §10).
  - El botón **RESERVAR de la tarjeta NO preselecciona el servicio**: navegación directa a `/[slug]/reservar` (preselección por query param queda FUERA de alcance; no se modifica el BookingWizard).
- **Equipo (barbers)**: tarjeta con **foto circular o iniciales** (hoy solo `name`; se usa el monograma de iniciales si no hay foto), nombre y, **si existiera** una especialidad en el futuro, badge dorado (condicionado a dato). Botón **"RESERVAR"** por barbero → `/[slug]/reservar`.
- **Galería** (capa preparada): grid/masonry frontend `LandingGallery.tsx` que **solo se renderiza si** `config.branding.galleryImageUrls?` / `config.sections.gallery` provee contenido. Como hoy **no existe** campo de galería ni almacenamiento de imágenes, esta sección **permanece oculta por defecto en el MVP**. No se añade campo nuevo al esquema en esta iteración (evita migración y mantienen ADR-013 intacto); la activación vendrá por una futura ADR que introduzca el campo de imágenes con su panel.
- **Stats** (capa preparada): `LandingStats.tsx` que renderiza un bloque de cifras **solo si** la config provee `presentation.stats` (array `[{ value, label }]`). Como la config actual no define stats y **no se inventan cifras**, la sección permanece oculta por defecto. La estructura (grid de 2-4 columnas, valores display + etiqueta mono) queda lista para cuando el panel la alimente (futura ADR con campo en el esquema).
- **Horarios** y **Ubicación**: datos existentes (`openingTime/closingTime`, `address`, `phone`), reskin a tarjetas oscuras + acentos gold. El copy genérico "Lunes a Domingo · Reserva con antelación" (hardcodeado en `LandingSections.tsx`) **no refleja un dato real configurable**: se neutraliza o se elimina para no fabricar días de atención. El Executor revisará el copy sin inventar datos.
- **Footer (dinámico)**: nuevo componente `LandingFooter.tsx` (extraído del footer inline actual de `LandingPage.tsx`) con nombre del shop + "Powered by TrimFlow" y enlace a `/[slug]/reservar`; fondo oscuro, tipografía mono.

### 6. CTA band (mantenido)

Banda oscura final con el segundo CTA dorado "Reservar ahora" (sweep de relleno en hover) + escuadra/barra inferior del motivo dorado (uso 3). Texto dentro de la banda en marfil/muted.

### 7. Animaciones — sutiles y gated por `prefers-reduced-motion`

- Fade + rise al entrar en viewport (reuso `Reveal.tsx` / `.landing-reveal`, IntersectionObserver ya existente en `hooks/landing`).
- Hover de tarjetas: `translateY(-2px)` + sombra suave + borde dorado pleno.
- Transición de la navbar (transparente → oscuro).
- Micro-interacciones en CTAs: sweep de relleno conservado (el barrido dorado/marfil avanza sobre texto).
- Indicador de scroll animado (keyframe en `globals.css`).
- **Sin dependencias pesadas**; todo con CSS/Tailwind + el IntersectionObserver ya existente, 100% gated por `prefers-reduced-motion`.

### 8. Firma visual: barber-pole → **hilo/motivo dorado**

La barber-pole tricolor (oxblood/tan/marfil) de ADR-014 **se reemplaza** por el motivo **gold-hairline** (respetando "bordes dorados con moderación"):
1. Indicador de sección activa en la navbar.
2. Hilo de progreso de scroll (`1px-3px`) dorado en el borde superior.
3. Escuadra/barra inferior del CTA band.

La clase `.landing-pole` se redefine (gradiente dorado/charcoal) en `globals.css`; los mismos 3 usos se conservan porque la estructura no cambia.

### 9. Multi-tenancy y evolución a temas

- La identidad dark luxury es el **nuevo default** (`LANDING_DEFAULTS` backend + espejo frontend).
- **Tenants con config guardada conservan su paleta/fuente** en `Tenant.settings.landing` hasta pulsar "Restaurar default" en `/admin/landing` (física ADR-013 intacta, sin migración de esquema).
- El diseño queda **reutilizable por tenant** (vía merge) y listo para evolucionar a **múltiples temas**: en el futuro se puede introducir un selector de tema (p.ej. presets "dark-luxury" / "ivory") **sin romper este ADR**, ya que todos los temas se traducen a los mismos 6 tokens. En esta iteración **no se añade** campo `theme` al esquema.

### 10. Restricciones de datos (para Planner/Executor)

- **NO inventar**: dirección, teléfono, horarios reales, cifras de stats, nombres/cantidades de barberos, redes sociales, ni la marca de "MÁS ELEGIDO".
- Todo elemento que requiere un dato ausente (imagen de servicio, badge popular, foto/especialidad de barbero, galería, stats) se implementa como **slot condicional**: si el dato existe → se renderiza; si no → no pinta nada (y queda oculto por defecto).
- El CTA de tarjeta **no** preselecciona el servicio (no se toca `BookingWizard`).

## Alternativas consideradas

| Alternativa | Razón para descartar |
|---|---|
| **(a) Refinar «Umbral de tinta + libro de cuentas» (mantener claro)** | El programador aprobó el cambio a dark luxury; el tema claro no comunica el rango "barbershop premium" que se busca (fotografía ancha, altísimo contraste, oro). Se reemplaza como default. |
| **(b) Display Playfair Display (en lugar de Marcellus)** | Marcellus es una display serif ya cargada con raza de barbería clásica; cambiar añadiría una cuarta fuente en `next/font`, rompería la continuidad del mapeo `fontFamily()` y del panel (que anuncia Marcellus/Spectral/Poppins), por un beneficio estético marginal. Se mantiene Marcellus. |
| **(c) Acento dorado brillante `#D4AF37`** | El dorado brillante/metálico se acerca al amarillo "mass-market" que la investigación de color 2026 descarta. Se elige el **old-gold sobrio `#C9A227`** (maduro, con restraint), que además ofrece mejor contraste/lectura. |
| **(d) Separar tarjetas por relleno/clara o usar bordes gruesos** | La investigación de dark luxury pide **bordes dorados con moderación**: hairline a 40% de opacidad en reposo y dorado pleno solo en hover/CTA. Se descarta el borde grueso omnipresente. |
| **(e) Añadir campo `theme` o `gallery`/`stats` al esquema LANDING_DEFAULT ahora** | Añadir al esquema rompería la premisa de "no migrar ADR-013" y cargaría datos falsos (stats/galería sin fuente). Galería y Stats se construyen como **capas frontend preparadas** que se activan cuando una futura ADR introduzca el campo y el panel; el esquema se mantiene intacto en esta iteración. |
| **(f) Inventar datos demo (cifras, redes, horarios, galería)** | Prohibido explícitamente: rompería la confianza pública y engañaría a los clientes. Todo dato ausente se omite o se renderiza condicionalmente. |

## Consecuencias

### Positivas
- **Identidad premium distintiva**: alto contraste + dorado old-gold como señal de lujo por restraint, coherente con la investigación de 2026 y diferenciada del benchmark.
- **Coherencia con ADR-013**: se mantienen los 6 tokens y el mecanismo de merge/aislamiento intactos: zero migración, zero cambio de contrato API, zero cambio de panel admin (salvo los nuevos defaults de color).
- **Cero datos falsos**: todo elemento de datos ausentes es condicional; no hay cifras, imágenes ni redes inventadas.
- **Mobile-first de serie** (hamburguesa, CTA prominente, botones touch-friendly) y **accesibilidad** (animaciones gated, contraste OK, `aria` en la navbar).
- **Preparado para futuro**: Gallery/Stats y la evolución a temas quedan esbozados sin cargar el MVP.

### Negativas
- **ADR-014 queda como identidad reemplazada**: la ruta marfil/oxblood y la barber-pole tricolor dejan de ser el default (su documentación se enmienda como histórico); el documento ADR-014 permanece como referencia de la implementación previa.
- **Inversión de relación fondo/texto**: los 6 tokens cambian de rol semántico respecto de ADR-014 (bone pasa de dark→claro, bg de claro→oscuro); hay que re-sincronizar `LANDING_DEFAULTS` en backend y el espejo frontend (coordinación de despliegue).
- **Componentes con hex hardcodeado**: `[slug]/page.tsx`, `[slug]/reservar/page.tsx`, `LandingState.tsx` y el overlay del hero incrustan hexes de la paleta 014; deben migrarse a tokens para que el tema/tenant funcione.
- **Navbar/hamburger + Gallery/Stats/Footer** añaden superficie de UI nueva (transición scroll, menú mobile, 3 componentes nuevos) → más test en mobile/accessibilidad.
- El **WIZARD_TOKENS** de `ReservationPage.tsx` mapea `--background` a `--landing-bg`; con fondo oscuro hay que verificar contraste de los inputs/cards shadcn del `BookingWizard` (sin tocar su lógica).

## Impacto en .docs

- **`decisions/ADR-014-identidad-visual-landing.md`**: se añade sección "Actualización" — la identidad «Umbral de tinta + libro de cuentas» queda reemplazada por **ADR-015** (dark luxury) como nuevo default; ADR-014 queda como registro de la identidad previamente implementada.
- **`decisions/ADR-013-personalizacion-landing-publica.md`**: se añade "Actualización" — los defaults de paleta/tipografía cambian de nuevo (dark luxury); el esquema, los 6 tokens, el merge y la física de CSS vars **permanecen intactos**; tenants con config guardada conservan su paleta hasta "Restaurar default".
- **`architecture/modules.md`**: se actualiza el paralelo estructural frontend (nuevos componentes `LandingFooter`/`LandingGallery`/`LandingStats`, roles de `LandingNav`/`LandingHero`/`LandingSections`, nota de la ruta `/reservar`).
- **`requirements/mvp-scope.md`**: se actualiza la línea stale de fuentes (Archivo/Space Grotesk → Marcellus/Spectral/IBM Plex Mono; la identidad dark es el default actual).
- **`changelog/2026.md`**: nueva entrada con fecha 2026-08-08 y referencia a ADR-015.

## Impacto en código

- **Backend `backend/src/modules/landing/landing-config.ts`**: se actualiza SOLO `LANDING_DEFAULTS.palette` (nuevos hexes) y (mantenidos) `typography.display/body`. Sin cambios de esquema, interfaces o `mergeLandingConfig`. No hay migración de DB.
- **Frontend `frontend/src/types/landing.ts`**: actualizar `LANDING_DEFAULTS.palette` (mismo hex) y la nota de identidad; `IMAGE_GUIDES` sin cambios.
- **`frontend/src/components/landing/landing-theme.ts`**: `landingThemeVars` — misma firma/6 tokens; las vars `--landing-hero-*` pasan a derivar de la paleta (sin hexes sueltos) y se reserva slot de galería/stats condicionales.
- **`frontend/src/components/landing/LandingHero.tsx`**: banda oscura con scrim + imagen (opcional), **doble CTA** (gold + outline), **indicador de scroll**, marquesina reskin en dark.
- **`frontend/src/components/landing/LandingNav.tsx`**: transparente→oscuro translúcido con `backdrop-blur` al scroll, hamburguesa + menú mobile (<md), CTA "Reservar cita", motivo dorado para el indicador de sección activa.
- **`frontend/src/components/landing/LandingSections.tsx`**: tarjetas premium (hairline/borde dorado, hover), botón "RESERVAR" por tarjeta, slots para imagen/"MÁS ELEGIDO"/especialidad (condicional), bandas dark.
- **Componentes nuevos en `components/landing/`**: `LandingGallery.tsx` (capa preparada, oculta por defecto), `LandingStats.tsx` (capa preparada, oculta por defecto), `LandingFooter.tsx` (extraída de `LandingPage`).
- **`frontend/src/components/landing/LandingCTA.tsx`**: CTA dorado + escuadra dorada sobre dark; `LandingState.tsx`: fallback oscuro.
- **`frontend/src/components/landing/LandingPage.tsx`**: integración de Gallery/Stats (capas preparadas) y `LandingFooter`.
- **`frontend/src/app/[slug]/page.tsx` y `[slug]/reservar/page.tsx`**: skeletons/fallbacks hardcodeados del tema 014 → tokens dark.
- **`frontend/src/components/booking/ReservationPage.tsx`**: sin cambios de lógica; revisión visual del mapeo `WIZARD_TOKENS` sobre fondo oscuro (mantiene `BookingWizard` intacto).
- **`app/globals.css`**: redefinir `.landing-pole` (dorado), `.landing-strop` caret dorado, reskin del marquee, keyframe del indicador de scroll, estilos navbar (scroll/transición/hamburger).
- **`app/layout.tsx`**: sin cambios (se MANTIENEN Marcellus/Spectral/IBM Plex Mono, Decisión §2).
- **`app/(dashboard)/admin/landing/page.tsx`**: sin cambios de esquema; los color pickers simplemente mostrarán los hexes dark por defecto.