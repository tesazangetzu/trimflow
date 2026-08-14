# ADR-016: Reconstrucción editorial de la landing pública `/[slug]`

**Estado:** ACEPTADO
**Fecha:** 2026-08-08

**Contexto:**
La implementación actual de la landing pública `/[slug]` (basada en ADR-015, «Dark Luxury») se rechaza por su **apariencia de dashboard**: el programador la percibe como «header + cards grises + fondo negro + botones amarillos», un tablero administrativo (CRUD) y no una landing comercial de barbería. El problema **no es la identidad** —paleta negro/marfil/dorado old-gold y tipografías Marcellus/Spectral/IBM Plex Mono son correctas— sino la **estructura visual**: grillas uniformes de tarjetas (`landing-card` en grid), cajas `surface` gris-carbón llenando la pantalla, y el acento dorado repartido por todos los elementos (iconos de servicio, precios, botones RESERVAR por tarjeta), lo que produce un efecto dashboard masivo y un exceso de dorado.

Se decide **reconstruir la composición visual** de la landing hacia una estética **editorial / premium / urbana / cinematográfica**, manteniendo intactas las capas que ya funcionan:

- **Identidad visual ADR-015**: paleta negro carbón / marfil / dorado old-gold y fuentes Marcellus (display) + Spectral (body) + IBM Plex Mono (utility) — **no se cambia la paleta ni las fuentes**.
- **Esquema de personalización ADR-013**: los mismos 6 tokens `--landing-*`, merge defensivo sobre `LANDING_DEFAULTS`, personalización por tenant en `Tenant.settings.landing` (JSONB) — **no se migra el esquema, no se añade campo nuevo**.
- **Contratos públicos** (`PublicShop` / `PublicBranch` / `PublicService` / `PublicBarber` en `types/public.ts`) — **no cambian**.
- **Lógica de reservas** — `BookingWizard` en `/[slug]/reservar` y endpoints `/v1/public/:slug` — **no se toca**.
- **Cero datos inventados** (premisa heredada: sin imágenes falsas, sin cifras, sin redes, sin direcciones/horarios ficticios).

## Decisión

Reconstruir la composición de la landing con una **estructura narrativa editorial de 8 secciones** (`HERO → INTRO → SERVICIOS → EQUIPO → EXPERIENCIA → HORARIOS+UBICACIÓN → CTA FINAL → FOOTER`), apoyada en principios de diseño explícitos y en un **Hero gobernado por defaults globales + override por tenant** que reutiliza los campos existentes de ADR-013. El ADR-016 se posiciona como la **decisión estructural**, complementaria al ADR-015 (decisión de identidad).

### 1. Estructura de secciones (composición editorial)

Estructura de la landing nueva y el mapa de datos real en cada sección:

| # | Sección | Composición visual | Datos fuente |
|---|---|---|---|
| 1 | **HERO** | viewport inicial de alto impacto | `shop.name`, `landing.presentation.*`, `landing.branding.heroImageUrl` |
| 2 | **INTRO / IDENTIDAD** | «MÁS QUE UN CORTE. UNA EXPERIENCIA.» — bloque editorial texto+visual | copy editorial (default) |
| 3 | **SERVICIOS** | lista editorial numerada con hairline | `PublicService` (name, description, price, durationMinutes) |
| 4 | **EQUIPO** | lista editorial con nombre fuerte + slot condicional de foto/especialidad | `PublicBarber` (id, name) |
| 5 | **EXPERIENCIA / DIFERENCIAL** | «CLÁSICO EN LA TÉCNICA. MODERNO EN EL ESTILO.» — sección visual fuerte | copy editorial (default) |
| 6 | **HORARIOS + UBICACIÓN** | bloque informativo unificado | `PublicBranch` (name, openingTime/closingTime, address, phone) |
| 7 | **CTA FINAL** | alto impacto: «¿LISTO PARA TU PRÓXIMO CORTE?» + «RESERVAR CITA» | `shop.name`, link `/[slug]/reservar` |
| 8 | **FOOTER** | marca, navegación, ubicación, horarios; redes SOLO si existen datos | `shop.name`, `shop.branches`, `config` — hoy no hay redes → no se muestran |

### 1.1 HERO — composición cinematográfica sobre el viewport inicial

- **Relleno**: `min-h-screen` / `min-h-[100svh]`; bloque de contenido a la izquierda o centrado (composición editorial). El `shop.name` se recibe del backend y se pinta siempre como parte del **eyebrow/kicker** (para no perder la identidad de la barbería; hoy el nombre gigante era un fallback del título).
- **Eyebrow** (mono, mayúsculas, tracking amplio): `presentation.tagline` (customizable por tenant). Si se quiere incluir también el nombre del shop, `shop.name` se muestra como kicker adicional — decisión de composición del Executor.
- **Headline**: `presentation.heroTitle`. Si está vacío (default), muestra el **headline global default del hero**: **«EL CORTE QUE TE DEFINE.»** (constante en el componente o `LANDING_DEFAULTS`).
- **Propuesta de valor**: `presentation.heroSubtitle` (body Spectral, muted).
- **CTA primario**: **«RESERVAR CITA»** (`accent` old-gold, texto oscuro) → `/[slug]/reservar`.
- **CTA secundario**: **«VER SERVICIOS»** (`outline`, hairline dorado, sin relleno) → ancla `#servicios`.
- **Indicador de scroll** discreto (chevron/caret dorado, borde inferior), oculto/gated con `prefers-reduced-motion`.
- **Imagen**: si `landing.branding.heroImageUrl` existe → **full-bleed velada** (opacidad ~35–50 %) + **scrim** `linear-gradient` hacia `--landing-bg` (mismo mecanismo actual, ningún storage nuevo). Si no existe → **fallback visual elegante**: composición tipográfica/geométrica (hairlines doradas, numeral de sección, bloques derivados de la paleta) — **NO se inventan URLs**. No hay placeholder de imagen.
- **Marquesina/ticker** (opcional): se conserva solo como **franja editorial de datos** (de `presentation.tickerItems`), integrada como banda fina inferior, tono sobrio (muted, separador `›` dorado), gated por `prefers-reduced-motion`. No funciona como barra dominante.

### 1.2 INTRO / IDENTIDAD

Sección editorial a doble columna asimétrica: a la izquierda el titular display **«MÁS QUE UN CORTE. UNA EXPERIENCIA.»**, a la derecha texto body (propuesta, copy) + un motivo visual (línea geométrica o silueta tipográfica). **Sin tarjetas.** El copy es textual estático (default en el componente; no es un dato de negocio inventado y no se fabrican cifras/fotos). No se añade campo al esquema para personalizarlo.

### 1.3 SERVICIOS — lista editorial (no grillas)

Los servicios (`PublicService` reales, aplanando las branches) se muestran como **lista numerada horizontal**:

```
01  Corte clásico        45 min      S/ 35.00   RESERVAR →
02  Barba y arreglo      20 min      S/ 25.00   —
…
```

- Cada fila: **número de índice editorial** (mono, muted), **nombre** (display serif, fg), **descripción** (body muted, una línea), **duración** (mono muted, `X min`), **precio** (mono; ahora en **muted**, no dorado por fila — el dorado se reserva), y una **acción «RESERVAR»** como ancla discreta con caret `→` que navega a `/[slug]/reservar`.
- **Hairline separador** entre filas (`1px`, `color-mix` con accent al ~30 %) en lugar de cajas `surface` grises. Whitespace generoso entre filas.
- El botón RESERVAR de la fila **no preselecciona el servicio**: navegación directa a `/reservar` (la preselección por query param queda fuera de alcance; el `BookingWizard` no se modifica).
- Por tanto **NO hay tarjetas**: no hay icono de tijera en caja dorada por tarjeta ni acentos repetidos.

### 1.4 EQUIPO — barberos reales, lista editorial

- `PublicBarber` expone **solo `id` + `name`**. Se renderiza una **lista editorial con nombre fuerte** (display serif en mayúsculas), **línea hairline** y **slot condicional de especialidad** (`specialty` — si el dato existiera, badge dorado; hoy no existe → nada).
- **Fotografía**: `PublicBarber` no tiene foto hoy; slot condicional para cuando exista (foto rectangular editorial, alto contraste), que por defecto no se pinta.
- **NO círculos de iniciales como diseño principal** (se elimina el avatar circular con iniciales doradas). **Fallback visual premium**: monograma tipográfico (iniciales en display serif de gran tamaño, o numeral de índice) dentro de una composición minimalista con hairline — sin inventar fotos ni datos.
- CTA por barbero «RESERVAR» → `/[slug]/reservar`.

### 1.5 EXPERIENCIA / DIFERENCIAL — sección visual fuerte

Sección editorial amplia con **«CLÁSICO EN LA TÉCNICA. MODERNO EN EL ESTILO.»** como titular display y una **composición asimétrica** texto / bloque visual (líneas, fotografía condicional si existiera, geometría tipográfica). Es la banda emocional de la landing; **sin cards**. Copy estático editorial (default), gated por `prefers-reduced-motion`.

### 1.6 HORARIOS + UBICACIÓN — bloque de datos reales

Se unifican las dos secciones del ADR-015 en **una sola sección** «HORARIOS · UBICACIÓN»:
- Por cada `PublicBranch` con datos reales: **horario** (`openingTime`–`closingTime`, mono muted), **dirección** (`address`, serif muted), **teléfono** (`phone`, mono muted). Los datos que faltan simplemente no se pintan.
- Formato de filas editoriales / tabla, sin tarjetas grises.
- **No se inventan horarios ni textos**: el copy genérico «Lunes a Domingo · Reserva con antelación» (hardcodeado en `LandingSections.tsx`) **se elimina** porque no es un dato real.

### 1.7 CTA final — alto impacto

Banda oscura final con: kicker (nombre del shop · RESERVA), titular display **«¿LISTO PARA TU PRÓXIMO CORTE?»**, apoyo body, y **un único botón dorado «RESERVAR CITA»** → `/[slug]/reservar` (mayor presencia; se eliminan los múltiples botones repartidos en cada sección). Se mantiene la escuadra/hilo dorado inferior (motivo de firma, uso 3).

### 1.8 FOOTER — marca, navegación y datos existentes

- Marca: `shop.name` + «Powered by TrimFlow».
- Navegación: anclas a Servicios/Equipo/Horarios/Ubicación y link a `/[slug]/reservar`.
- Ubicación y horarios **si** el shop tiene branches con datos reales (filas compactas).
- **Redes sociales SOLO si existiera un campo y un dato**: hoy no existe → **no se muestra** ningún apartado de redes. No se inventan links.

## 2. Principios de diseño (vinculantes para Planner/Executor)

| Principio | Regla concreta |
|---|---|
| **Editorial, NO dashboard** | Sin grillas de tarjetas `surface`. Composición asimétrica, numeración, hairlines, whitespace generoso. Nada que recuerde a `/admin` (CRUD). |
| **Jerarquía visual fuerte** | Una idea por sección: kicker mono (accent) → titular display (fg) → cuerpo serif (muted). Escala tipográfica escalada con `clamp()`. |
| **Ritmo y espaciado editorial** | Padding generoso, ritmo distinto por sección, composición a 1/2 columnas asimétricas; no secciones que repitan el mismo grid. |
| **Fotografía protagonista** | La imagen (si existe) es lo que vende: full-bleed velada + scrim. Jamás imágenes miniatura en cajas. Sin inventar URLs. |
| **Uso moderado del dorado (old-gold)** | El dorado SOLO en: CTA primarios, kickers/indicadores, hairline de acento, estados activos del nav. **NO** en precios, iconos repetidos, bordes de caja ni texto masivo. Restraint. |
| **Evitar cajas «grises» (`surface`)** | Se abandona la alternancia de bandas `surface` llenando la pantalla. Fondo `--landing-bg` + whitespace + hairlines; `--landing-surface` solo para bloques muy puntuales (CTA band, hero band interna). |
| **Responsive explícito** | Hero `min-h-[100svh]` compuesto a columna única en mobile; nav mobile como menú hamburguesa accesible; CTA siempre alcanzable desde el primer viewport; tipografía con `clamp()`; **sin overflow horizontal** (el marquee se limita/suprime para no generar scroll lateral, gated por reduced-motion). |
| **Microinteracciones sutiles** | Hover suave en filas de lista (indicador/arrastre, sin salto brusco), `Reveal` fade+rise en viewport, transiciones suaves en la nav, feedback en botones. **NO** animaciones decorativas excesivas. |
| **Accesibilidad** | `prefers-reduced-motion` desactiva TODA animación, contraste AA (old-gold solo sobre `--landing-bg` en zonas grandes; texto marfil NUNCA sobre dorado), `aria-label`/roles en menú, foco visible. |

## 3. Hero: defaults globales + tenant override (sin cambiar esquema)

El hero se configura con **defaults globales en `LANDING_DEFAULTS` (backend `landing-config.ts` + espejo `frontend/src/types/landing.ts`)** y cada tenant lo personaliza **solo con los campos existentes** de ADR-013 (nada nuevo):

| Elemento del Hero (ADR-016) | Campo EXISTENTE en ADR-013 | Default global | Override del tenant (saved config) |
|---|---|---|---|
| Eyebrow / kicker | `presentation.tagline` | `"BARBERÍA · CLÁSICA"` | tagline personalizado |
| Nombre del shop | `shop.name` (del backend) | — | — (siempre `PublicShop.name`) |
| Headline | `presentation.heroTitle` | default del componente: **«EL CORTE QUE TE DEFINE.»** | heroTitle personalizado |
| Propuesta de valor | `presentation.heroSubtitle` | copy default actual | heroSubtitle personalizado |
| Imagen del hero | `branding.heroImageUrl` | `null` (→ fallback visual) | URL hero personalizada |
| Label CTA primario | — (constante global del componente) | **«RESERVAR CITA»** | — (no se añade campo al esquema) |
| Label CTA secundario | — (constante global del componente) | **«VER SERVICIOS»** | — |
| Ticker / marquesina | `presentation.tickerItems` | defaults actuales | personalizable |

- El **CTA label** es un default global del componente **sin campo en el esquema** (respeta ADR-013 sin migración).
- **Barbería El Clásico (tenant demo)**: puede usar contenido específico como demo (por `Tenant.settings.landing` o seed), pero **NO hardcodeado como estructura global**; el default de código nunca lleva el contenido del demo.
- **No se añade ningún campo nuevo** al esquema: no `heroOverlay`, no `redesSociales`, no `gallery`, no `stats`. Gallery/Stats siguen siendo capas frontend condicionales del ADR-015.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|---|---|
| **(a) Conservar la composición actual (refinar tarjetas de ADR-015)** | El problema es estructural (grillas/cajas/amarillo masivo), no cromático. Refinar las tarjetas conserva el patrón «dashboard» rechazado. La cuadrícula de tarjetas se sustituye por la lista editorial. |
| **(b) Añadir campos al esquema (ctaLabel, foto barbero, redes, stats, heroOverlay)** | Rompe ADR-013 sin migración y cargaría el MVP con paneles. Se reutilizan los campos existentes (tagline/heroTitle/heroSubtitle/heroImageUrl). Todo sin fuente real permanece como slot condicional o capa preparada. |
| **(c) Hardcodear el hero del demo (contenido de Barbería El Clásico como global)** | El demo es un tenant específico; convertirlo en default llevaría su contenido a todas las barberías. El default global es el copy editorial neutral. |
| **(d) Cambiar paleta/tipografía (fondos nuevos, acento más claro)** | La identidad ADR-015 está fijada y es correcta (investigación 2026, AA); el rechazo es composicional. Cambiar la paleta añadiría coste sin resolver la estructura. |
| **(e) Ilustraciones/fotos de stock en el default** | Prohibido (inventar recursos/URLs). El fallback del hero es una composición tipográfica/geométrica de la paleta; la imagen solo se usa donde exista URL real. |
| **(f) Añadir secciones sin datos (redes, galería, stats)** | Fuera de alcance y sin fuente: no hay datos de redes; los grids sin datos inventarían contenido falso. Quedan como capas condicionales. |

## Consecuencias

### Positivas
- **La landing deja de verse como dashboard/CRUD**: la lista editorial + numeración + hairlines + whitespace transmiten un local de barbería premium, no una interfaz admin.
- **Zero migración/esquema**: se reutilizan el esquema ADR-013, los 6 tokens, los contratos públicos y la lógica de reservas intactos.
- **Cero datos falsos**: todo dato ausente (foto barbero, especialidad, imagen hero, redes) se omite o se renderiza condicionalmente.
- **CTA principal + secundaria claros**: hero, filas de servicios, CTA final y footer apuntan a `/[slug]/reservar` con el mismo destino.
- **Defaults globales + override por tenant**: cualquier tenant nuevo hereda la nueva composición editorial sin tocar el panel.
- **ADR-015 se preserva como identidad**: paleta/tipografía sin cambios; ADR-016 añade la capa estructural reutilizando sus tokens.

### Negativas
- **Reconstrucción de componentes**: refactor amplio en `LandingHero`, `LandingSections`, `LandingCTA`, `LandingFooter`, `LandingNav` y `LandingPage` (más copy editorial estático nuevo en Intro y Experiencia, que no es configurable en el MVP).
- **Se reduce el uso del dorado**: el dorado queda como acento puntual; la marquesina pasa a elemento secundario u opcional, y es preciso re-pasar contraste AA, fondo oscuro y estados en el equipo (sin avatar).
- **El nombre del shop ya no ocupa el rol del título gigante**: la identidad de marca depende del eyebrow/nav (compensado con `shop.name` en hero + nav).
- **Intro y Experiencia con copy editorial estático** (default componente), sin personalización por tenant en el MVP; una futura ADR podría exponerlas al panel.
- **Coordinación de defaults**: los cambios de valor de `heroTitle`/`heroSubtitle` en `LANDING_DEFAULTS` deben sincronizarse backend + espejo frontend (despliegue coordinado).

## Impacto en .docs

- **`decisions/ADR-016-reconstruccion-editorial-landing.md`** (este documento): decisión **estructural** — sustituye la estructura de secciones/tarjetas del ADR-015 con el esquema editorial de 8 secciones en `/[slug]`; **no reemplaza la identidad**.
- **`decisions/ADR-015-identidad-dark-luxury-landing.md`**: se mantiene **intacto como decisión de identidad** (paleta, tipografía, vars derivadas). Se enmendaría con una nota de que la composición de secciones (grid de tarjetas, equipo con avatares, CTA band anterior) se sustituye por la composición editorial del ADR-016; no cambian los colores de la marca.
- **`decisions/ADR-013-personalizacion-landing-publica.md`**: actualización de nota — el hero pasa a consumir `tagline/heroTitle/heroSubtitle/heroImageUrl` como campos del override, con nuevos valores default de `heroTitle/heroSubtitle`; **esquema, 6 tokens, merge y persistencia intactos**; no hay campo nuevo.
- **`architecture/modules.md`**: actualizar el paralelo frontend `components/landing/` (roles editoriales de `LandingHero`/`LandingSections`/`LandingCTA`/`LandingFooter`/`LandingNav`, sección unificada Horarios/Ubicación, y nota de que `LandingGallery`/`LandingStats` continúan como capas preparadas).
- **`changelog/2026.md`**: nueva entrada con fecha 2026-08-08 y referencia a ADR-016.

## Impacto en código

- **Se reconstruyen los componentes de landing** (mantienen props y rutas actuales):
  - `frontend/src/components/landing/LandingHero.tsx`: hero narrativo full-viewport, eyebrow (`tagline`) + `shop.name`, headline (`heroTitle` || `"EL CORTE QUE TE DEFINE."`), CTA «RESERVAR CITA» / «VER SERVICIOS», scroll hint; imagen full-bleed+scrim si `heroImageUrl`; fallback tipográfico-geométrico; marquesina como franja opcional sobria.
  - `frontend/src/components/landing/LandingSections.tsx`: **servicios en lista numerada con hairline** (sin cajas doradas por item), **equipo en lista editorial** (sin círculos de iniciales; slot condicional foto/especialidad), **intro** y **experiencia** editoriales, **Sección «HORARIOS · UBICACIÓN» unificada** (datos reales de branch), con eliminación del copy genérico de horarios/días.
  - `frontend/src/components/landing/LandingCTA.tsx`: CTA final editorial «¿LISTO PARA TU PRÓXIMO CORTE?» + único botón «RESERVAR CITA» (reuso del sweep con hairline dorado; gated por reduced-motion).
  - `frontend/src/components/landing/LandingFooter.tsx`: marca, navegación, ubicación/horarios de `shop.branches`, sin redes (hoy no hay datos).
  - `frontend/src/components/landing/LandingNav.tsx`: mismo esqueleto y anclas; indicador de sección activa con acento, menú móvil accesible; estética editorial (sin estilo de dashboard).
  - `frontend/src/components/landing/LandingPage.tsx`: orquestación de las 8 secciones en el nuevo orden y defaults; provisión de `heroTitle` default cuando está vacío; mantiene `LandingGallery`/`LandingStats` (capas → `null` por defecto).
- **Se MANTIENEN (sin cambios de lógica)**:
  - `frontend/src/components/landing/LandingGallery.tsx` y `LandingStats.tsx` como **capas preparadas** (ADR-015: retornan `null` sin datos).
  - `Reveal.tsx` (scroll reveal, IntersectionObserver + `prefers-reduced-motion`), `landing-theme.ts` (6 tokens + `--landing-hero-*`), `LandingState.tsx`.
  - `frontend/src/components/booking/ReservationPage.tsx` y **WIZARD_TOKENS** (mapeo shadcn scoped): se conservan; revisar contraste sobre fondo oscuro ya documentado en ADR-015, sin tocar la lógica.
  - `app/layout.tsx` (fuentes Marcellus/Spectral/IBM Plex Mono) — sin cambios.
- **Backend**: `backend/src/modules/landing/landing-config.ts` — solo ajuste de **valores default** de `presentation.heroTitle` (copy editorial) y `heroSubtitle`; sin cambios de interfaz/esquema/`mergeLandingConfig` ni migración de DB. El espejo `frontend/src/types/landing.ts` se sincroniza.
- **`frontend/src/app/globals.css`**: clases editoriales nuevas (lista numerada, hairlines, índices mono, fallback hero), ajustes de marquesina para **sin overflow horizontal**, reducción del CSS de `.landing-card`; todas las keyframes gated por `prefers-reduced-motion`.
- No se toca `/admin/landing` (no hay campo nuevo; solo cambian los valores default que muestra el formulario).