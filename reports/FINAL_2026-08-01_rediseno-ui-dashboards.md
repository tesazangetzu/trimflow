# Reporte Técnico Final
## Rediseño de los 3 dashboards de TrimFlow (inspirado en Admindek)

> **Generado:** 2026-08-01
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2 · React 19.2 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui · recharts · next-themes
> **Iteraciones realizadas:** 4
> **Veredicto final:** APROBADO (iteración 4: 25/25 ✓, 0 fallas)

---

## Objetivo confirmado

Recrear fielmente el diseño del template de dashboard "Admindek Next" (https://admindek-next.dashboardpack.com/dashboard/analytics) en los 3 dashboards de TrimFlow (admin, barber, super-admin): sidebar colapsable, header sticky con blur, cards KPI, tablas, tokens de tema, dark mode con toggle y charts similares (recharts) — usando datos reales de TrimFlow.

**Éxito cuando:**
- Los 3 dashboards usan el layout Admindek con los menús del rol.
- Tokens/tema replicados (paleta ocean-blue + dark mode).
- Cards KPI con sparklines; chart principal, donut de dispositivos, mapa mundial y transacciones.
- `npm run lint` y `npm run build` pasan.
- Servicios levantados al final.

**Fuera de alcance:** NO tocar backend; NO crear páginas nuevas del template; NO copiar código fuente del template (licencia); NO cambiar la API de datos.

**Supuestos asumidos:** cada rol conserva sus menús/rutas; datos reales de la API de TrimFlow; charts con recharts; dark mode toggle en header.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO CON OBSERVACIONES | — (23/26 ✓, 3 observaciones de severidad BAJA, ninguna bloqueante) |
| 2         | APROBADO CON OBSERVACIONES | Correcciones de fidelidad solicitadas por el programador (paleta, header, deuda técnica) — 25/25 ✓, 0 fallas |
| 3         | APROBADO | Corrección de 3 observaciones menores (título duplicado, literales hex, ancho colapsado) — 11/11 ✓, 0 fallas |
| 4         | APROBADO | Corrección de diferencias visuales del sidebar y header (sombra, items borde a borde, hover==active, logo blanco, header sin border-b, tokenización) — 25/25 ✓, 0 fallas |

---

## Correcciones de la Iteración 2 (solicitadas por el programador)

### Paleta de colores corregida a los valores EXACTOS del template

**Problema detectado:** el sidebar se había dejado blanco en modo claro y con colores incorrectos en oscuro; la paleta general usaba valores propios (indigo/figma) en vez de los del template.

**Corrección aplicada** (en `globals.css`):
- **Sidebar SIEMPRE oscuro** en ambos modos: `#263544` (navy) en light, `#1a1b1d` (casi negro) en dark — como el template. Ya no es blanco en claro.
- Paleta general exacta del template: `--background:#f4f7fa` (light) / `#212224` (dark), `--muted-foreground:#888`, `--success:#2ca87f`, `--warning:#e58a00`, `--border:#dbe0e5`, etc.
- `--radius:0.25rem` (antes 0.625rem).
- `--chart-1..5` = valores del template (`#4680ff`, `#1abc9c`, `#e58a00`, `#7c4dff`, `#3ebfea`).
- Añadidos `--warning`/`--warning-foreground`.

### Header reorganizado (izquierda/derecha)

**Problema detectado:** "todo estaba a la izquierda". En el template el header tiene 2 grupos.

**Corrección** (en `dashboard-shell.tsx`):
- **IZQUIERDA**: toggle de sidebar + search (icono + kbd ⌘K).
- **DERECHA**: toggle de tema + campana (badge verde) + avatar de usuario (gradiente primary) con dropdown.
- **Sin título/breadcrumb en el header** — ahora van dentro del `<main>` vía props `pageTitle`/`pageBreadcrumb`.
- Item activo del sidebar: `border-l-[3px] border-sidebar-primary bg-black/10 text-white` (texto blanco, como el template).

### Deuda técnica resuelta

| # | Deuda iteración 1 | Estado |
|---|-------------------|--------|
| 1 | Tendencias KPI estáticas en Admin | ✅ Dinámicas con `percentChange` (14d vs 7d) |
| 2 | Paleta hex duplicada (`DONUT_COLORS`, `statusColors`) | ✅ Reemplazada por `CHART_COLORS` de chart-tools |
| 3 | `handleToggle` sin `catch` en super-admin | ✅ Añadido `catch` + banner de error |

---

## Decisiones técnicas tomadas

### 1. Shell de layout compartido con menús por rol (Opción A)

**Qué se decidió:**
Crear `components/layouts/dashboard-shell.tsx` como shell visual Admindek parametrizado (`menu`, `roleLabel`, `brandLabel`) y `nav-config.tsx` con `ADMIN_NAV`, `BARBER_NAV`, `SUPER_ADMIN_NAV`. Los 3 layouts existentes quedan como wrappers finos que pasan su config al shell.

**Por qué se tomó esta decisión:**
Los 3 layouts previos duplicaban ~80% del código (sidebar, header, mobile sheet, dropdown). El shell compartido elimina esa duplicación, respeta `modules.md` (siguen existiendo 3 layouts por rol) y centraliza el mantenimiento visual.

**Alternativas descartadas:**
- *3 layouts separados mantenidos a mano* — triplica mantenimiento, riesgo de drift entre dashboards.
- *1 layout raíz en `(dashboard)/layout.tsx` con menú por `user.role`* — cambia la estructura definida en `modules.md` y mezcla responsabilidades de ruteo.

**Impacto en .docs:**
Ninguno — la estructura documentada (layouts por rol) se preserva.

**Impacto en el código:**
`admin-layout.tsx`, `barber-layout.tsx`, `super-admin-layout.tsx` → wrappers finos; nuevos `dashboard-shell.tsx` y `nav-config.tsx`.

### 2. Tokens de tema ocean-blue con valores hex directos

**Qué se decidió:**
Redefinir los tokens shadcn en `globals.css` (`:root` y `.dark`) con la paleta ocean-blue del ADR-007 usando valores **hex directos** (no `oklch`), manteniendo los mismos nombres de variables.

**Por qué se tomó esta decisión:**
recharts no resuelve variables CSS `oklch` para los SVG; los hex directos simplifican el paso de colores a los charts. Mantener los nombres de tokens evita romper los componentes `ui/` existentes.

**Alternativas descartadas:**
- Tokens `oklch` — incompatibles con recharts.
- Renombrar tokens — rompería toda la base de componentes.

**Impacto en .docs:**
Reflejado en ADR-007 (paleta con valores hex).

**Impacto en el código:**
`globals.css` reescrito con paleta ocean-blue (`--primary #4680ff`, `--secondary #7c4dff`, `--accent #e91e63`, sidebar navy `#34495e` dark, `--chart-1..5`, `--success`).

### 3. Dark mode con next-themes

**Qué se decidió:**
Instalar `next-themes` y crear `theme-provider.tsx` (con `attribute="class"`, `defaultTheme="system"`) + `mode-toggle.tsx`. `ThemeProvider` se monta por fuera de `AuthProvider` en `providers.tsx`.

**Por qué se tomó esta decisión:**
ADR-007 exige next-themes para dark mode sin FOUC (parpadeo) y con persistencia. Es el estándar de shadcn/ui.

**Impacto en .docs:**
Documentado en ADR-007.

**Impacto en el código:**
Nuevos `theme/theme-provider.tsx`, `theme/mode-toggle.tsx`; modificados `app/layout.tsx` (suppressHydrationWarning) y `app/providers.tsx`.

### 4. Charts con recharts y mapa con componente propio

**Qué se decidió:**
Instalar `recharts@3.10.1` para sparklines (KPI cards), chart de área principal, donut de distribución. El "mapa mundial" del template se sustituye por un panel propio (`locations-overview.tsx`) con grid decorativo + marcadores + lista de sucursales, **sin** react-simple-maps ni path-data copiados del template.

**Por qué se tomó esta decisión:**
ADR-007 exige recharts (misma librería del template) y prohíbe copiar librerías/patrones visuales del template por licencia. El mapa propio evita el riesgo legal y elimina dependencias pesadas.

**Alternativas descartadas:**
- react-simple-maps (como el template) — riesgo de licencia y dependencia pesada.
- Charts con CSS puro — pierde interactividad (tooltips, leyendas).

**Impacto en .docs:**
Documentado en ADR-007.

**Impacto en el código:**
Nuevos `dashboard/kpi-card.tsx`, `area-chart.tsx`, `donut-chart.tsx`, `transactions-table.tsx`, `locations-overview.tsx`, `chart-tools.ts`.

### 5. Datos reales de la API, no demo del template

**Qué se decidió:**
Todos los dashboards consumen los servicios existentes (`appointments`, `barbers`, `branches`, `services`, `tenants`). Se verificó (FASE 0) que `GET /appointments` puebla `barber`, `customer`, `service` y que `GET /services` incluye `price`, por lo que no se requirieron llamadas adicionales ni cambios de backend.

**Por qué se tomó esta decisión:**
ADR-007: "inspirado en" nunca copia; los datos deben ser reales de TrimFlow.

**Impacto en .docs:**
Ninguno — contratos API intactos.

**Impacto en el código:**
Las 3 páginas dashboard reescritas consumiendo datos reales.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `frontend/src/components/layouts/dashboard-shell.tsx` | Shell Admindek compartido: sidebar 264px→72px colapsable, header sticky blur 74px, search+⌘K visual, mode toggle, logout, mobile sheet | D1 (shell compartido) |
| `frontend/src/components/layouts/nav-config.tsx` | Configs de menú reales por rol (ADMIN_NAV, BARBER_NAV, SUPER_ADMIN_NAV) | D1 |
| `frontend/src/components/theme/theme-provider.tsx` | Wrapper de next-themes para dark mode sin FOUC | D3 |
| `frontend/src/components/theme/mode-toggle.tsx` | Toggle dark mode (sun/moon) en el header | D3 |
| `frontend/src/components/dashboard/kpi-card.tsx` | Card KPI con label, valor, tendencia y sparkline recharts | D4 |
| `frontend/src/components/dashboard/area-chart.tsx` | Chart principal de área con toggle de rango 7d/30d | D4 |
| `frontend/src/components/dashboard/donut-chart.tsx` | Donut con leyenda y tooltip | D4 |
| `frontend/src/components/dashboard/transactions-table.tsx` | Tabla de transacciones/citas recientes (reusa Table de ui/) | D4 |
| `frontend/src/components/dashboard/locations-overview.tsx` | Panel "mapa" propio con grid + marcadores + sucursales | D4 |
| `frontend/src/components/dashboard/chart-tools.ts` | Utilidades puras: agrupación, formato moneda/fecha es-MX, colores | D4 |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/package.json` | +recharts, +next-themes | D4, D3 |
| `frontend/src/app/globals.css` | Tokens ocean-blue hex (light+dark), +`--success` | D2 |
| `frontend/src/app/layout.tsx` | +`suppressHydrationWarning` en `<html>` | D3 |
| `frontend/src/app/providers.tsx` | +ThemeProvider externo a AuthProvider | D3 |
| `frontend/src/components/layouts/admin-layout.tsx` | Refactor a wrapper fino de DashboardShell | D1 |
| `frontend/src/components/layouts/barber-layout.tsx` | Refactor a wrapper fino de DashboardShell | D1 |
| `frontend/src/components/layouts/super-admin-layout.tsx` | Refactor a wrapper fino de DashboardShell | D1 |
| `frontend/src/components/dashboard/index.ts` | Exports nuevos/limpios | D4 |
| `frontend/src/app/(dashboard)/admin/dashboard/page.tsx` | Rediseño completo con KPIs+sparkline, área, donut, ubicaciones, transacciones | D5 |
| `frontend/src/app/(dashboard)/barber/dashboard/page.tsx` | Rediseño: agenda del día con KPIs, donut por estado, área por hora, tabla | D5 |
| `frontend/src/app/(dashboard)/super-admin/dashboard/page.tsx` | Rediseño: KPIs de tenants, área de creación, donut por estado, tabla con activar/suspender | D5 |

### Archivos eliminados

| Archivo | Motivo de eliminación |
|---------|----------------------|
| `frontend/src/components/dashboard/stat-card.tsx` | Componente demo sustituido por KpiCard; sin imports residuales |
| `frontend/src/components/dashboard/order-stats.tsx` | Componente demo sustituido; sin uso |
| `frontend/src/components/dashboard/order-time.tsx` | Componente demo sustituido; sin uso |
| `frontend/src/components/dashboard/most-ordered.tsx` | Componente demo sustituido; sin uso |
| `frontend/src/components/dashboard/rating-charts.tsx` | Componente demo sustituido; sin uso |
| `frontend/src/components/dashboard/dashboard-card.tsx` | Componente demo sustituido; sin uso |

---

## Cambios en archivos clave

### `frontend/src/components/layouts/dashboard-shell.tsx`

**Antes:** no existía (cada layout duplicaba su sidebar/header).
**Después:** shell compartido con sidebar `w-[264px]` colapsable a `w-[72px]` (persistencia en localStorage), header `sticky top-0 z-30 h-[74px] bg-background/70 backdrop-blur`, items activos con `border-l-2 border-sidebar-primary`, search + kbd ⌘K visual, ModeToggle, bell, avatar con dropdown y logout vía `useAuth`, mobile con Sheet.
**Por qué es importante:** es la pieza central del rediseño; cualquier cambio visual global de los 3 dashboards se hace aquí una sola vez.

### `frontend/src/app/globals.css`

**Antes:** tema "Figma" previo con tokens indigo (#5A6ACF) y figma-*.
**Después:** paleta ocean-blue del ADR-007 en tokens shadcn (`--primary #4680ff`, `--secondary #7c4dff`, `--accent #e91e63`, sidebar navy `#34495e` dark), valores hex directos, `--success` definido, variantes `.dark` presentes.
**Por qué es importante:** define la identidad visual completa (light + dark) que consumen todos los componentes; cambiar un token cambia toda la app.

### `frontend/src/app/(dashboard)/admin/dashboard/page.tsx`

**Antes:** página con componentes demo del MVP (StatCard, OrderStats, etc.).
**Después:** 4 KPIs con sparkline (Ingresos, Citas hoy, Barbers activos, Conversión), chart de área de citas/ingresos con rango 7d/30d, donut de servicios más usados, panel de ubicaciones con sucursales, tabla de transacciones paginada — todo alimentado por servicios reales.
**Por qué es importante:** es la vista principal del negocio; muestra el patrón de consumo de datos que replican los otros dashboards.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Los 3 dashboards usan el layout Admindek con menús del rol | Cumplido | [✓] Criterios 16-17 del Auditor; shell + nav-config con menús reales por rol |
| Tokens/tema replicados (ocean-blue + dark mode) | Cumplido | [✓] Criterios 8-10; globals.css hex ocean-blue + next-themes |
| Cards KPI con sparklines, chart principal, donut, mapa y transacciones | Cumplido | [✓] Criterios 11-12, 18; recharts + mapa propio + transacciones |
| `npm run lint` pasa | Cumplido | 0 errores, 0 warnings |
| `npm run build` pasa | Cumplido | 24 rutas compilan, SSR/RSC OK |
| Servicios levantados al final | Cumplido | Backend+Postgres+Redis en Docker; frontend en `npm run dev` |
| Sin tocar backend ni contratos API | Cumplido | [✓] Criterio 15; 0 archivos en backend/ |
| Sin copiar código del template (licencia) | Cumplido | [✓] Criterio 13; sin clases/JSX/path-data del template |

---

## Deuda técnica identificada

**Sin deuda técnica pendiente.** Las 3 observaciones de la iteración 1 y las 3 de la iteración 2 quedaron resueltas en las iteraciones 2 y 3.

| # | Descripción | Estado |
|---|-------------|--------|
| 1 | Tendencias KPI estáticas en Admin | Resuelta (iter 2) — dinámicas con `percentChange` |
| 2 | Paleta hex duplicada (`DONUT_COLORS`, `statusColors`) | Resuelta (iter 2) — `CHART_COLORS` |
| 3 | `handleToggle` sin `catch` en super-admin | Resuelta (iter 2) — `catch` + banner |
| 4 | Título duplicado en Barber | Resuelta (iter 3) — eliminado `<h1>` interno |
| 5 | Literales hex semánticos residuales | Resuelta (iter 3) — tokens (`var(--destructive)`, `var(--muted-foreground)`, `var(--border)`) |
| 6 | Ancho colapsado sidebar 72px vs 80px | Resuelta (iter 3) — `w-[80px]` |
| 7 | Sombra del sidebar (lado derecho, sin border-r) | Resuelta (iter 4) — token `--sidebar-shadow` |
| 8 | Items del sidebar de borde a borde (px-5, nav px-0) | Resuelta (iter 4) |
| 9 | Hover == Active con borde izquierdo | Resuelta (iter 4) — `bg-sidebar-accent` |
| 10 | Logo del sidebar en blanco | Resuelta (iter 4) — `text-sidebar-primary-foreground` |
| 11 | Header sin border-b | Resuelta (iter 4) |
| 12 | Colores hardcodeados tokenizados | Resuelta (iter 4) — 0 hex en dashboard-shell |

> **Único señalamiento pendiente (preexistente, fuera de alcance):** warning de deprecación `middleware`→`proxy` en Next 16 (`middleware.ts`). No afecta el build.

---

## Lo que el programador debe saber

- **Los 3 dashboards fueron rediseñados** con el layout Admindek (sidebar colapsable, header sticky blur, dark mode con toggle) y datos reales de la API. `npm run lint` y `npm run build` pasan sin errores.
- **Dark mode funcional**: toggle sun/moon en el header, respeta `system` por defecto, persiste en reload (next-themes).
- **Paleta ocean-blue** como marca principal (`#4680ff`), aplicada en light y dark.
- **Convención nueva a mantener**: los componentes nuevos de dashboard usan **solo tokens shadcn** (`bg-card`, `text-foreground`, `--chart-*`, `--success`), no los tokens legacy `figma-*` que aún quedan en globals.css.
- **Referencia de maquetación** (no copiable por licencia) en `reports/ref-admindek/` (analytics.html, chunk.css, theme.css).
- **Observaciones del Auditor**: todas resueltas en las iteraciones 2 y 3. Sin deuda técnica pendiente.
- **Backend intacto**: 0 archivos modificados; los datos vienen de los servicios existentes sin cambios de contrato.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-01_rediseno-ui-dashboards_iter1.md` |
| 2         | `reports/2026-08-01_rediseno-ui-dashboards_iter1.md` (sección "Auditoría Iteración 2") |
| 3         | `reports/2026-08-01_rediseno-ui-dashboards_iter1.md` (sección "Auditoría Iteración 3") |
| 4         | `reports/2026-08-01_rediseno-ui-dashboards_iter1.md` (sección "Auditoría Iteración 4") |
