# ADR-014: Nueva identidad visual de la landing pública («Umbral de tinta + libro de cuentas»)

**Estado:** ACEPTADO
**Fecha:** 2026-08-07

**Contexto:**
La landing pública `/[slug]` (ADR-012) embebe el flujo de reserva en la misma página, lo que provocaba **salto de scroll** al avanzar entre pasos del formulario (el wizard empuja el contenido hacia abajo y pierde la lectura del hero/servicios). Además, su identidad visual actual es urbana/street con acento amarillo (`#FFB300`, token `neon`), que la investigación de mercado de 2026 califica como **mass-market**: el amarillo brillante y el neón comunican barato/gamer, no el rango premium de una barbería clásica seria.

La investigación de color (2026) fija los principios del lujo por **restraint**: máximo 4 colores simultáneos (1 ancla oscura + 1 acento metálico + 1-2 neutros), evitar neón y amarillo brillante. Se aprueba un rediseño con identidad **NUEVA (opción C)** decidida por el Planner, separando además el formulario de reserva a una vista propia `/[slug]/reservar` (patrón del proyecto de referencia).

**Premisas que se dan por sentadas (documentadas en este ADR, no re-diseñadas):**
- La separación formulario/landing y los flujos de navegación siguen el patrón del proyecto de referencia.
- La identidad visual fue elegida por el equipo de diseño; este ADR solo la fija y la traduce a la arquitectura de temas existente (ADR-013).

## Decisión

Nueva identidad visual para la landing pública `/[slug]`, dirección **«Umbral de tinta + libro de cuentas»** (Ink threshold → Ivory ledger): hero en banda tinta oscura + páginas en marfil. Herencia de barbería clásica seria y cálida: adoquín, tinta sobre papel, grabado y libro de cuentas. Estética completa (hero + 4 secciones) que separa el salto de scroll del formulario moviéndolo a una ruta propia.

### 1. Paleta (mapeada sobre las 6 claves existentes `--landing-*`)

Se re-mapean los **mismos 6 tokens** del esquema ADR-013 (`landing-config.ts`); ADR-013 en su mecanismo queda intacto (CSS vars + merge de config).

| Clave `--landing-*` | Hex | Rol |
|---|---|---|
| `--landing-bg` (asphalt) | `#F4EBDD` | Fondo base marfil (páginas) |
| `--landing-surface` (concrete) | `#E6D9C3` | Superficie tan (bandas/lienzos secundarios) |
| `--landing-fg` (bone) | `#2B211C` | Texto principal (tinta) |
| `--landing-muted` (smoke) | `#6E5E52` | Texto secundario taupe |
| `--landing-accent` (neon) | `#6F1E23` | Acento oxblood (CTAs, kickers, barber-pole) |
| `--landing-danger` (blood) | `#A4161A` | Alerta / error |

**Tinta del hero** (banda interior oscura): `#14100E` con override scoped de `--landing-fg: #F3EBDD` y `--landing-muted: #B9AB97` (texto claro sobre la banda tinta, solo dentro del hero).

### 2. Tipografía — 3 roles vía `next/font/google`

| Rol | Fuente | Uso |
|---|---|---|
| Display | **Marcellus** | Títulos de sección y hero en mayúsculas grabadas, tracking amplio |
| Body | **Spectral** | Serif de lectura para párrafos y descripciones |
| Utility | **IBM Plex Mono** | Kickers, precios, horarios — efecto «libro de cuentas» |

Justificación: una sola fuente display serif de lujo (noches clásicas de barbería), una serif legible para cuerpo (lectura premium) y un monoespaciado para los datos — el recibo de barbería antiguo.

### 3. Separación de secciones por CONTENIDO (no bordes)

- **Alternancia de tono de fondo**: marfil (`--landing-bg`) ↔ tan (`--landing-surface`) para distinguir bandas.
- **Escala tipográfica**: kicker mono → título display → body.
- **Strop**: hairline horizontal de `1px` con un **caret corto oxblood** al inicio como divisor de sección (evoca el cuero de afilado). No usar bordes de caja.

### 4. Firma visual: la **barber-pole**

Franja vertical tricolor (oxblood `/ tan / marfil`) de **6-8px** usada en exactamente **3 sitios** (ventana única de firma de marca):
1. **Indicador de sección activa** en el sticky nav.
2. **Hilo de progreso de scroll** de `1px` en el borde superior del viewport.
3. **Escuadra inferior del CTA band** (botón/banda de llamada a reservar).

### 5. Animación

- **Marquesina/ticker**: conservada pero **reskin** a la nueva paleta.
- **Entrada del hero**: **stagger** (fade + rise) por bloques.
- **Scroll reveals**: `IntersectionObserver` (fade+rise al entrar en viewport).
- **Micro-interacciones de CTA**: **sweep de relleno** (el relleno avanza sobre el texto en hover).
- Todo gated por `prefers-reduced-motion` (respeto de accesibilidad): sin animación si el usuario lo solicita.

### 6. NAVEGACIÓN: sticky nav + anclas + CTA de reserva

La landing `/[slug]` muestra SOLO información de la barbería (Servicios, Equipo, Horarios, Ubicación). La reserva vive en `/[slug]/reservar`.

- **Sticky nav** con anclas a las secciones (Servicios, Equipo, Horarios, Ubicación) + CTA "Reservar" → `/[slug]/reservar`.
- **Scroll suave** + **highlight de sección activa** (indicador barber-pole, uso 1).
- **CTA band** a mitad/final con la escuadra inferior (uso 3) invita de nuevo a `/[slug]/reservar`.

### 7. Formulario separado: `/[slug]/reservar`

- Nueva vista `/[slug]/reservar` con botón de volver a `/[slug]` y flujo de reserva completo (reutiliza `BookingWizard`, ADR-012).
- El wizard usa tokens shadcn que se mapean **scoped por CSS vars** a la nueva paleta en el wrapper de `/reservar` (misma filosofía de aislamiento que ADR-013: CSS vars de scope local, sin tocar dashboards).
- Elimina el salto de scroll y da una URL directa de reserva (patrón del proyecto de referencia).

## Alternativas consideradas

| Alternativa | Razón para descartar |
|---|---|
| **(a) Refinar la identidad actual street/amarillo** | El acento `#FFB300` (mass-market) y el neón chocan con la investigación de color 2026 (restraint, no amarillo brillante). Un refinamiento marginal no posiciona como premium: la dirección ya no sostiene la propuesta. |
| **(b) Adoptar el estilo del proyecto de referencia** (navy/dorado/serif clásico) | Es la estética del proyecto competidor de referencia; copiarla elimina la diferenciación y el código del que depende. El lujo por restraint cabe en una paleta propia, sin imitación directa. |
| **(c) Nueva identidad propia «Umbral de tinta + libro de cuentas»** (ELEGIDA) | Cumple la investigación de color (4 colores, sin neón/amarillo), se hereda de la barbería clásica seria y cálida, es distintiva frente al benchmark y se implementa mapeando los mismos 6 tokens `--landing-*` (sin migrar el esquema ADR-013). |

## Consecuencias

### Positivas
- **Identidad distintiva y premium**: lujo por restraint; la barber-pole es una firma visual inconfundible y barata de implementar (3 usos).
- **Diferenciación**: no se imita el benchmark (opción b) y se abandona el street/amarillo (opción a).
- **Menos fricción de reserva real**: al separar formulario a `/[slug]/reservar` se elimina el salto de scroll; URL directa y navegable.
- **Bajo coste estructural**: se re-mapean los mismos 6 tokens de ADR-013; el esquema `LANDING_DEFAULTS` no cambia de forma.
- **Accesibilidad**: animación 100% gated por `prefers-reduced-motion`.

### Negativas

- **Tenants con config guardada** no ven la nueva estética (su paleta/fuentes persisten en `Tenant.settings.landing`) hasta dar "Restaurar default" en `/admin/landing` (mecanismo ADR-013 intacto).
- **Cambio de HEX defaults en frontend y backend**: actualizar `LANDING_DEFAULTS` (backend) y el espejo `frontend/src/types/landing.ts`; requiere coordinación de despliegue.
- **Se eliminan fuentes Archivo / Space Grotesk** en favor de Marcellus / Spectral / IBM Plex Mono (cambio de carga `next/font`, layout raíz).
- **Hero assets**: el hero pasa a banda tinta → revisar proporciones/guidelines `IMAGE_GUIDES`.
- Se genera una ruta nueva (`/[slug]/reservar`) y una vista de la landing reutilizada sin wizard: se duplican ligeramente partes de presentación (nav/cta) entre ambas vistas.

## Impacto en .docs

- **`decisions/ADR-012-landing-publica-reservas.md`**: se enmienda con la separación del formulario a `/[slug]/reservar` (vista de info + CTA de navegación) y referencia a ADR-014.
- **`decisions/ADR-013-personalizacion-landing-publica.md`**: se enmienda con el cambio de defaults de paleta/tipografía (la física de CSS vars + merge permanece intacto).
- **`architecture/modules.md`**: documentar la nueva ruta frontend `/[slug]/reservar` y los componentes `landing/` (Nav/Cta/Reveal/LandingState) en el paralelo estructural.
- **`changelog/2026.md`**: entrada con fecha y referencia a ADR-014 al implementar.

## Impacto en código

- **Frontend `app/[slug]/page.tsx`**: `LandingPage` — hero + 4 secciones informativas, sin wizard embebido; CTA navega a `/[slug]/reservar`.
- **Frontend `app/[slug]/reservar/page.tsx`** (NUEVO): wrapper del `BookingWizard` (patrón de referencia) + botón de volver a `/[slug]`; CSS vars scoped de la paleta nueva sobre los tokens shadcn del wizard.
- **`components/landing/LandingHero.tsx`**: reskin hero en banda tinta + stagger de entrada.
- **`components/landing/LandingSections.tsx`**: secciones Servicios/Equipo/Horarios/Ubicación, alternancia marfil/tan + strop; reemplaza el embed del wizard.
- **Componentes nuevos `components/landing/`**: `LandingNav.tsx` (sticky + anclas + highlight con indicador barber-pole), `LandingCta.tsx` (CTA "Reservar" con sweep de relleno + escuadra barber-pole), `Reveal.tsx` (scroll reveal con IntersectionObserver + `prefers-reduced-motion`), `LandingState.tsx` (lógica de sección activa / scroll progress). Marquesina reskin en `LandingHero`/`LandingSections`.
- **`components/landing/landing-theme.ts`**: `landingThemeVars` — nuevo mapeo de hex a las 6 claves `--landing-*` + `--landing-hero-*`; elimina el default amarillo/street como estética de serie.
- **`components/booking/BookingWizard.tsx`**: se reutiliza (sin cambios de lógica) desde `/[slug]/reservar`.
- **`types/landing.ts`** (frontend): mirror de `LANDING_DEFAULTS` con la nueva paleta.
- **`app/layout.tsx`**: carga `next/font/google` de Marcellus (`--font-display`), Spectral (`--font-body`), IBM Plex Mono (`--font-mono`) en lugar de Archivo/Space Grotesk (Poppins de dashboards permanece, ADR-007).
- **`app/globals.css`**: se retoca el keyframe `landing-marquee` (reskin) y se añaden `.landing-strop` (hairline + caret) y las vars de la nueva paleta.
- **Backend `backend/src/modules/landing/landing-config.ts`**: actualización de `LANDING_DEFAULTS.palette` (hex) y tipografía (family "Marcellus"/"Spectral"/"IBM Plex Mono"); sin cambios de esquema/merge.
- No se requiere migración de DB (reutiliza `Tenant.settings.landing`).

---

## Actualización 2026-08-08

La identidad «Umbral de tinta + libro de cuentas» queda **reemplazada como identidad de serie** por la nueva **dark luxury** (ver **ADR-015**): fondo negro/negro carbón con acento dorado old-gold, tarjetas premium con hairline dorado y CTA siempre visible; el motivo **barber-pole tricolor** se redefine como **hilo/motivo dorado** (mismos 3 usos: indicador de nav, progreso de scroll, escuadra del CTA band); Galería y Stats se preparan como capas frontend condicionales (ocultas por defecto). Las fuentes **Marcellus/Spectral/IBM Plex Mono se mantienen**.

ADR-014 permanece vigente como **registro histórico de la implementación** previa y como base estructural: la física de la landing (rutas `/[slug]` + `/[slug]/reservar`, separación del formulario, componentes `landing/`, CSS vars de scope local) **no cambia**. Los defaults de `LANDING_DEFAULTS` (backend + `types/landing.ts`) pasan a la paleta dark luxury definida en **ADR-015**.