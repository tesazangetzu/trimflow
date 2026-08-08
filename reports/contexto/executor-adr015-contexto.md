# Contexto para Executor-agent — Implementación ADR-015 (dark luxury)

TRIGGER=ORCHESTRATOR MODE=MANUAL

Actúas como el **Executor-agent** de TrimFlow. El Orquestador te invoca para implementar la nueva identidad **dark luxury** de la landing pública `/[slug]` según el ADR-015 y el plan del Planner.

## Tu rol

Implementa el plan técnico completo. Usa `.docs/` como fuente de verdad (especialmente ADR-015). Opera en modo automático: no esperes confirmación entre pasos salvo errores bloqueantes. Persiste el estado en `reports/2026-08-08_adr015-dark-luxury_iter1.md`.

## Contexto del proyecto

- Monorepo TrimFlow: `backend/` (NestJS) + `frontend/` (Next.js 16.2.12 App Router, React 19, Tailwind v4, shadcn).
- La landing pública se sirve en `/[slug]` (p.ej. `/barberia-el-clasico`), multi-tenant, datos de `GET /v1/public/:slug`.
- El formulario de reserva vive en `/[slug]/reservar` reutilizando `BookingWizard` (NO tocar su lógica).
- La personalización por tenant se persiste en `Tenant.settings.landing` (JSONB) y se fusiona sobre `LANDING_DEFAULTS` con `mergeLandingConfig` (ADR-013). La estética se aísla a `/[slug]` por CSS variables de scope local vía `landingThemeVars(config)` en `frontend/src/components/landing/landing-theme.ts`.
- La identidad ACTUAL (ADR-014) es marfil/tan/tinta/oxblood (tema claro). Se reemplaza por **dark luxury** (ADR-015): negro carbón + dorado old-gold.

## Decisiones del ADR-015 (fuente de verdad — respetar EXACTAMENTE)

1. **Paleta** (6 tokens, mismo esquema ADR-013, sin migrar):
   - `--landing-bg` (asphalt) = `#0A0A0A` (fondo negro carbón)
   - `--landing-surface` (concrete) = `#111111` (superficie/tarjetas)
   - `--landing-fg` (bone) = `#F2EDE4` (texto marfil)
   - `--landing-muted` (smoke) = `#8A8178` (texto secundario)
   - `--landing-accent` (neon) = `#C9A227` (dorado old-gold)
   - `--landing-danger` (blood) = `#C0392B` (danger)
2. **Tipografía**: SE MANTIENEN Marcellus (display) / Spectral (body) / IBM Plex Mono (utility). Sin cambios en `layout.tsx` ni `fontFamily()`.
3. **Hero**: banda oscura + imagen velada (si `heroImageUrl`) + scrim; doble CTA (dorado primario + outline secundario a `#servicios`); indicador de scroll; marquee reskin.
4. **Navbar**: transparente → oscuro translúcido al scroll (umbral ~32-48px, backdrop-blur); hamburguesa <md; CTA "Reservar cita"; motivo dorado para indicador activo.
5. **Secciones**: bandas oscuras alternadas; tarjetas premium con hairline dorado (40% reposo, pleno hover); botón "RESERVAR" por tarjeta → `/[slug]/reservar` (sin preselección de servicio); slots condicionales para imagen/"MÁS ELEGIDO"/especialidad (ocultos si no hay dato).
6. **Galería y Stats**: capas frontend preparadas (`LandingGallery.tsx`, `LandingStats.tsx`) que NO se renderizan por defecto (no hay dato). Footer extraído a `LandingFooter.tsx`.
7. **Firma visual**: barber-pole → motivo gold-hairline (`.landing-pole` redefinido en globals.css; 3 usos conservados).
8. **Animaciones**: sutiles, gated por `prefers-reduced-motion`, sin deps pesadas (reuso Reveal/IntersectionObserver).
9. **NO inventar datos**: dirección, teléfono, horarios, cifras, redes, "MÁS ELEGIDO", especialidades. Neutralizar copy hardcodeado "Lunes a Domingo".
10. **Multi-tenancy**: dark luxury es el nuevo default (LANDING_DEFAULTS backend + frontend); tenants con config guardada conservan su paleta hasta "Restaurar default".
11. **WIZARD_TOKENS** de `ReservationPage.tsx`: revisar contraste sobre fondo oscuro sin tocar lógica del BookingWizard.

## Plan del Planner (pasos a ejecutar)

### Paso 1 — Backend: nuevos hexes en `LANDING_DEFAULTS.palette`
**Archivo:** `backend/src/modules/landing/landing-config.ts`
- Sustituir SOLO los 6 valores de `LANDING_DEFAULTS.palette` (líneas 71–75):
  - `asphalt: '#0A0A0A'`, `concrete: '#111111'`, `smoke: '#8A8178'`, `bone: '#F2EDE4'`, `neon: '#C9A227'`, `blood: '#C0392B'`
- Actualizar el comentario de cabecera (líneas 4–6): referencia a «dark luxury (ADR-015)». No tocar interfaces, `mergeLandingConfig` ni `mergeObject`.

### Paso 2 — Espejo de defaults en el frontend
**Archivo:** `frontend/src/types/landing.ts`
- Aplicar los mismos 6 hexes al bloque `LANDING_DEFAULTS.palette` (líneas 53–59).
- Sincronizar el comentario de cabecera con "default dark luxury (ADR-015)". No cambiar tipografía, ni `IMAGE_GUIDES`, ni interfaces.

### Paso 3 — Derivar vars `--landing-hero-*` de la paleta
**Archivo:** `frontend/src/components/landing/landing-theme.ts`
- Reemplazar los hexes fijos de `landingThemeVars` (líneas 21–23) por valores derivados de `config.palette`:
  - `"--landing-hero-bg": config.palette.asphalt` (o `color-mix(in srgb, config.palette.asphalt 96%, black)`)
  - `"--landing-hero-fg": config.palette.bone`
  - `"--landing-hero-muted": config.palette.smoke`
- Mantener intactos `--landing-font-*` y `fontFamily()`.

### Paso 4 — `globals.css`: gold-hairline, marquee, scroll-hint, navbar, tarjetas premium
**Archivo:** `frontend/src/app/globals.css`
- **Motivo gold-hairline — `.landing-pole` (líneas 310–318):** redefinir como línea dorada: `background: var(--landing-accent);`
- **Strop (`.landing-strop`)**: sin cambios de estructura; el caret ya toma `--landing-accent` (ahora dorado).
- **Tarjetas premium — nueva clase `.landing-card`:** hairline dorado al reposo (40% de opacidad) → pleno el hover. Usar `::before` con `inset-inline` + `height:2px; background: var(--landing-accent); opacity:.4` y `opacity:1` en `.landing-card:hover::before`.
- **Navbar — `.landing-nav.is-scrolled`**: `background: color-mix(in srgb, var(--landing-bg) 82%, transparent)`, `backdrop-filter: blur(12px)`, borde `var(--landing-surface)`. `.landing-nav.is-open` para el panel de hamburguesa (<md).
- **Scroll indicator — `.landing-scroll-hint`:** chevron/barra vertical baja del hero con keyframe `landing-scroll-pulse`.
- **prefers-reduced-motion:** ampliar el selector (líneas 343–357) para cerrar las nuevas animaciones (scroll-hint, pulse).
- No modificar el `:root`/`.dark` de shadcn.

### Paso 5 — `LandingHero.tsx`: scrim + doble CTA + indicador de scroll + marquee re-skin
**Archivo:** `frontend/src/components/landing/LandingHero.tsx`
- **Fallbacks actualizados a dark:** sustituir los fallbacks `#14100E` / `#F3EBDD` / `#B9AB97` por `#0A0A0A` / `#F2EDE4` / `#8A8178`.
- **Scrim (si `hasHeroImage`):** reforzar el gradiente del overlay del hero (línea 52) para velar la imagen: `linear-gradient(to bottom, var(--landing-hero-bg) 0%, rgba(10,10,10,0.55) 50%, var(--landing-hero-bg) 100%)` y ajustar `opacity-40`→ `opacity-30`.
- **Doble CTA (después del `Link` "Reservar ahora", líneas 113–125):**
  - Mantener el CTA primario dorado (bg `--landing-accent`, texto `--landing-bg`).
  - **Agregar CTA secundario outline** → `href={\`/${slug}#servicios\`}`, estilo `border: 1px solid var(--landing-accent); color: var(--landing-fg); background: transparent;` mismo `.hero-block` con `animationDelay: "400ms"`.
  - En móvil los dos CTA se apilan verticalmente (flex-col sm:flex-row).
- **Indicador de scroll:** `<a href="#servicios">` fijo a la parte baja del header con clase `.landing-scroll-hint` (texto "SCROLL" + flecha animada), estilado vía CSS Paso 4. No renderizado si `prefers-reduced-motion`.
- **Marquee re-skin (línea 148–179):** cambiar el color de los items de `var(--landing-surface)` → `var(--landing-hero-muted)`; el separador `›` ya dorado se mantiene; añadir `border-y` dorado sutil opcional. No cambiar la animación ni los datos.

### Paso 6 — `LandingNav.tsx`: scroll transparente→oscuro + hamburguesa + motivo dorado
**Archivo:** `frontend/src/components/landing/LandingNav.tsx`
- **Estado de scroll:** en el listener rAF existente (líneas 30–39) además de `progress`, mantener `scrolled = window.scrollY > 40`. Añadir clase condicional `is-scrolled` al `<nav>`; toggle de estado con `useState`.
- En reposo (sin scroll) el nav es **transparente**.
- **Hamburguesa <md:** añadir estado `open`; botón `<Menu/>`/`<X/>` (lucide) en las clases `md:hidden`; panel `.landing-nav.is-open` con `NAV_LINKS` como `<a>` a `#id`, `aria-expanded`/`aria-label`. Cerrar al navegar.
- **CTA navbar:** mantener `Link /[slug]/reservar` pero texto "Reservar cita". Estilo dorado (bg accent, fg bg).
- **Indicador activo dorado:** se mantiene el `color: var(--landing-accent)` + la barra `landing-pole` (ahora dorada) del link activo. Se replica en el menú móvil.

### Paso 7 — `LandingSections.tsx`: tarjetas premium + RESERVAR + slots condicionales + bandas dark
**Archivo:** `frontend/src/components/landing/LandingSections.tsx` (y agregado de prop `slug`)
- **Bandas alternadas oscuras:** mantener el patrón `SectionTone`; con la paleta dark, `tone="light"` → `--landing-bg` (#0A0A0A) y `tone="warm"` → `--landing-surface` (#111). Si el contraste entre `#0A0A0A` y `#111111` resulta muy bajo, usar para "warm" un tono un octavo más claro derivado (ej. `color-mix(in srgb, var(--landing-surface) 85%, var(--landing-fg) 15%)`) manteniéndolo en tokens.
- **Tarjetas premium:** añadir `className="landing-card"` al `Card`. Mantener `Reveal`/`hover:-translate-y-1`.
- **Botón "RESERVAR" por tarjeta de servicio:**
  - `LandingSections` recibe nueva prop `slug: string`.
  - `ServicesSection` y `BarbersSection` reciben `slug` como prop. En cada tarjeta de servicio, debajo de la duración, añadir:
    ```tsx
    <Link href={`/${slug}/reservar`} className="mt-4 inline-block ..." style={{ border: "1px solid var(--landing-accent)", color: "var(--landing-accent)", fontFamily: "var(--landing-font-mono)" }}>
      RESERVAR
    </Link>
    ```
    **Sin preselección de servicio** (sin query params).
- **Slots condicionales** (imagen, badge "MÁS ELEGIDO", especialidad): renderizarlos únicamente si el dato existe; como hoy `PublicService`/`PublicBarber` no traen esos datos, serán invisibles por defecto. Usar campos opcionales con guard:
  - `s.image?.src && <img ...>` ocult;
  - badge solo si `(s as { mostChosen?: boolean }).mostChosen`;
  - especialidad de barbero solo si existe campo (en `PublicBarber` no existe → no se renderiza).
- **Neutralizar "Lunes a Domingo" (línea 192):** sustituir la cadena por `"Reserva con antelación"` (neutral, sin inventar horario/días).

### Paso 8 — `LandingCTA.tsx`: CTA dorado + escuadra dorada
- Fallback hexes `#14100E` → `#0A0A0A`, `#F3EBDD` → `#F2EDE4`, `#B9AB97` → `#8A8178`.
- Mantener el CTA dorado (bg `--landing-accent`, texto `--landing-bg`) y el sweep.
- La **escuadra inferior** (`landing-pole`, uso 3) ya vira a dorada con el re-skin del Paso 4.

### Paso 9 — `LandingState.tsx`: fallback oscuro
- Sustituir todos los hexes hardcodeados de ADR-014 por dark luxury: `#F4EBDD` → `#0A0A0A`, `#E6D9C3` → `#141414` (o `#111111`), `#6F1E23` → `#C9A227`, `#2B211C` → `#F2EDE4`, `#6E5E52` → `#8A8178`. No cambiar copy ni estructura.

### Paso 10 — Nuevos componentes: `LandingFooter.tsx`, `LandingGallery.tsx`, `LandingStats.tsx`
**Archivos nuevos** en `frontend/src/components/landing/`:
- **`LandingFooter.tsx`** — extraer el footer inline de `LandingPage.tsx` (líneas 47–56). Props: `{ shopName: string }`. Renders: `shopName · Powered by TrimFlow` en `--landing-muted`, `--landing-font-mono`, bg `--landing-bg`, con `border-top` hairline dorado sutil. **No inventar** teléfonos/redes/dirección.
- **`LandingGallery.tsx`** — capa preparada, **no renderizada por defecto**: Props `{ photos: string[] }`; si `photos.length === 0 → return null`. Estructura opcional: grid de `img` con `loading="lazy"`, hairline dorado, `Reveal`.
- **`LandingStats.tsx`** — capa preparada, **no renderizada por defecto**: Props `{ stats?: Array<{ label: string; value: string }> }`; si vacío/indefinido → `return null`. **No inventar cifras**.

### Paso 11 — `LandingPage.tsx`: integración
- Imports de los 3 nuevos componentes (sustituir el footer inline).
- `<LandingFooter shopName={shop.name} />` al final.
- Gallery/Stats: pasar data vacía (hoy no existen en el payload → los componentes retornan null).
- Mantener `landingThemeVars` + `background: var(--landing-bg)`.

### Paso 12 — Skeletons de las rutas → tokens
- `frontend/src/app/[slug]/page.tsx`: reemplazar `bg-[#F4EBDD]` (línea 12), `background: "#F4EBDD"` (línea 17), `border-[#6F1E23]` (línea 20) y `bg-[#E6D9C3]` (línea 22) por `#0A0A0A` / `#C9A227` / `#111111`.
- `frontend/src/app/[slug]/reservar/page.tsx` (`ReserveSkeleton`): aplicar el mismo token swap (líneas 24 y 28).
- No cambiar `dynamic`, `Suspense`, estructura.

### Paso 13 — `ReservationPage.tsx`: revisión visual de `WIZARD_TOKENS`
**Archivo:** `frontend/src/components/booking/ReservationPage.tsx` — SOLO CSS tokens, sin tocar `BookingWizard` ni lógica:
- Revisar contraste sobre el nuevo fondo oscuro: `--background: #0A0A0A`, `--card: #111111`.
- Ajustes recomendados:
  - `--border` / `--input`: subir visibilidad sobre oscuro → `color-mix(in srgb, var(--landing-fg) 28%, transparent)` (desde 22%).
  - `--secondary`/`--muted`/`--accent`: `var(--landing-surface)` — si el wizard usa `muted` para fondo de pills, considerar `color-mix(in srgb, var(--landing-surface) 80%, transparent)`.
  - `--primary-foreground` y `--destructive-foreground`: `var(--landing-bg)` (negro) — asegura legibilidad sobre dorado/rojo.
- Comprobación manual en el wizard; si hay controles con contraste insuficiente, solo se tocan valores de `WIZARD_TOKENS`, nunca `BookingWizard.tsx`.

### Paso 14 — Ficheros que NO se tocan
- `frontend/src/app/layout.tsx` — sin cambios (tipografía intacta).
- `frontend/src/app/[slug]/reservar` — solo skeleton; la lógica del wizard intacta.
- `frontend/src/app/(dashboard)/admin/landing/page.tsx` — SIN cambios de esquema.
- Todo el backend de reservas/auth/appointments/disponibilidad/API pública: sin cambios.

## Pasos de verificación (obligatorios)

1. **Backend compila:** en `backend/`: `npm run build` (o `npx tsc --noEmit`).
2. **Frontend lint:** en `frontend/`: `npm run lint`.
3. **Typecheck:** en `frontend/`: `npx tsc --noEmit`.
4. **Build:** en `frontend/`: `npm run build`.
5. **Responsive manual** (DevTools 360 / 390 / 414 px) en `/[slug]` de un tenant real:
   - Navbar con hamburguesa <md; menú abre/cierra.
   - Hero: doble CTA apilado vertical sin Overflow; indicador de scroll visible.
   - Tarjetas de servicios (RESERVAR, hairline dorado reposo/hover); grid `sm:grid-cols-2 lg:grid-cols-3` con flow vertical en móvil.
   - Verificar **sin overflow horizontal** (`document.documentElement.scrollWidth <= innerWidth`) en las 3 anchuras.
6. **Booking sin tocar:** en `/[slug]/reservar` recorrer el wizard (paso fecha → servicio/barbero → hora → datos → confirmación) con tenant real; controles legibles (contraste aceptable) y el token `WIZARD_TOKENS` probado.
7. **Multi-tenancy:** tenant con paleta guardada conserva sus colores; tenant sin guardada ve dark luxury; usar "Restaurar default" si es necesario.
8. **Sin datos inventados / copys neutralizados:** `grep -rn "El Clásico"` y `grep -rn "Lunes a Domingo"` → sin resultados; hero/lttp sin datos hardcodeados de Dirección/teléfono/stats.
9. **Animaciones:** con `prefers-reduced-motion: reduce` en el navegador, hero/marquee/scroll-hint quedan estáticos.
10. **Auditoría final** de diseño (imagen premium, orden de secciones correcto).

## Riesgos y notas

- **Multi-tenancy:** cambiar `LANDING_DEFAULTS` afecta a todo tenant sin configuración guardada; es el comportamiento esperado del ADR-015.
- **Contraste dorado #C9A227:** válido sobre #0A0A0A/#111111 como acento/CTA; **no** usar como texto de párrafo largo (usar bone/muted). Mantener `--primary-foreground` y CTA texts en `var(--landing-bg)` (negro) sobre fondo dorado.
- **Multi-tenancy + hero vars:** al derivar `--landing-hero-*` de la paleta, los tenants de paleta clara tendrán hero claro; es el diseño multi-tenant. No reintroducir hardcoded tinta.
- **No inventar datos:** ninguno de "MÁS ELEGIDO", especialidad, dirección, teléfono, horarios, redes, cifras de stats. Los slots condicionales y Stats/Gallery deben quedar ocultos hoy.
- **Responsive:** no usar grid de 4 columnas sin break; revisar la hamburguesa a `<md` exactamente igual que los links prefixed.
- **Animaciones:** reutilizar `Reveal`/`useReveal` y `use-active-section`; no instalar librerías nuevas; todas las animaciones nuevas deben ir gated por `prefers-reduced-motion`.
- **No toques** `BookingWizard.tsx`, `use-public-data`, `PublicLayout`, endpoints. Limitado a `WIZARD_TOKENS` (solo CSS).
- **Next.js 16:** antes de escribir cualquier cosa nueva (scroll events, `use client`), consultar `node_modules/next/dist/docs/` para APIs/convenciones actuales de la versión y respetar advertencias de deprecación (ver AGENTS.md de `frontend/`).
- **Final obligatorio:** ejecutar `graphify update .` desde la raíz del repo para sincronizar el knowledge graph.

## Reporte de ejecución

Al terminar, escribe el reporte en `reports/2026-08-08_adr015-landing-luxury_iter1.md` con:
- Resumen de cambios por archivo
- Resultado de cada verificación (lint/typecheck/build/responsive/booking/multi-tenancy)
- Problemas encontrados y cómo se resolvieron
- Notas para el Auditor