# Reporte Técnico Final
## Cierre del ciclo ADR-016 + mejoras de UI en dashboards

> **Generado:** 2026-08-14
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript + next-themes + lucide-react (frontend) · NestJS + TypeORM + PostgreSQL (backend)
> **Iteraciones realizadas:** 1
> **Veredicto final:** ✅ APROBADO CON OBSERVACIONES (2 observaciones de severidad BAJA, no bloqueantes)

---

## Objetivo confirmado

Cerrar el ciclo del ADR-016 (commit + documentación), implementar toggle de tema cíclico en los dashboards, corregir iconografía de eliminar/suspender en tablas, ejecutar QA visual y resolver deuda técnica BAJA.

**Éxito cuando:**
- ADR-016 commiteado (código + .docs + reportes + contexto)
- mvp-scope.md: ADR-012 y ADR-013 marcados [x]
- Reporte FINAL del ADR-016 refleja las 2 iteraciones reales
- ModeToggle: botón que cicla claro → oscuro → sistema (sin desplegable)
- Tablas admin (branches/barbers/services/customers): botón eliminar con icono trash funcional
- Super-admin (tenants + dashboard): candado Lock/Unlock reemplazado por icono Ban (suspender)
- QA visual en runtime con tenant demo verificado
- Deuda técnica BAJA resuelta
- Lint/tsc/tests/build OK; Auditor aprueba

**Fuera de alcance:** código de la landing (ya aprobado), features post-MVP, cambios de arquitectura o backend de dominio, BookingWizard y lógica de reservas.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | ✅ APROBADO CON OBSERVACIONES | — (0 fallos; 2 observaciones de severidad BAJA no bloqueantes) |

---

## Decisiones técnicas tomadas

### 1. Toggle de tema cíclico (sin desplegable)

**Qué se decidió:**
Reemplazar el `DropdownMenu` de `mode-toggle.tsx` (3 opciones: Claro/Oscuro/Sistema) por un botón que cicla al hacer click: `light → dark → system → light...`. El icono refleja el modo actual (Sun/Moon/Monitor).

**Por qué se tomó esta decisión:**
El programador solicitó explícitamente que no fuera un desplegable, sino un botón que cambie de modo con cada click. Se mantiene `next-themes` (ADR-007) como mecanismo de persistencia.

**Alternativas descartadas:**
- Mantener el DropdownMenu (rechazado por el programador).
- Ciclo solo light/dark (el programador pidió incluir "sistema").

**Impacto en .docs:**
No requiere ADR nuevo; es un refinamiento de implementación del dark mode ya documentado en ADR-007.

**Impacto en el código:**
`frontend/src/components/theme/mode-toggle.tsx` reescrito. Aplica a los 3 dashboards (componente compartido en `dashboard-shell.tsx`).

### 2. Botón de eliminar (Trash2) en tablas admin

**Qué se decidió:**
Añadir botón de eliminar con icono `Trash2` + Dialog de confirmación + toast en las 4 tablas admin (branches, barbers, services, customers), que hoy solo tenían editar (Pencil). Reutiliza los endpoints DELETE ya existentes en el backend.

**Por qué se tomó esta decisión:**
El programador detectó que las tablas no tenían forma de eliminar registros. El backend ya exponía `@Delete(':id')` en todos los controllers, por lo que solo faltaba la capa frontend. Se replicó el patrón ya validado en `admin/schedules` y `barber/schedule/blocks`.

**Alternativas descartadas:**
- No añadir botón (dejaba el CRUD incompleto).
- Eliminar sin confirmación (riesgo de borrado accidental).

**Impacto en .docs:**
No requiere ADR; es completar el CRUD admin ya documentado en `reports/2026-08-02_admin-crud-modales.md`.

**Impacto en el código:**
`admin/{branches,barbers,services,customers}/page.tsx` — botón Trash2 + Dialog + toast + estado de carga.

### 3. Icono Ban para suspender/activar tenant

**Qué se decidió:**
Reemplazar el candado `Lock`/`Unlock` por el icono `Ban` en las tablas de super-admin (tenants + dashboard), manteniendo la semántica de suspender/activar y los tooltips.

**Por qué se tomó esta decisión:**
El programador percibía el candado como un botón de "eliminar". Al añadir botones de eliminar reales (Trash2) en admin, era necesario diferenciar visualmente la acción de suspender (que NO elimina) usando un icono inequívoco.

**Alternativas descartadas:**
- Cambiar el candado a Trash2 (semánticamente incorrecto: suspender ≠ eliminar).
- Power (menos claro que Ban para "suspender").

**Impacto en .docs:**
No requiere ADR; es refinamiento de iconografía.

**Impacto en el código:**
`super-admin/tenants/page.tsx` y `super-admin/dashboard/page.tsx` — Lock/Unlock → Ban.

### 4. Deuda técnica BAJA del ADR-016

**Qué se decidió:**
Resolver los 5 items de deuda BAJA del FINAL del ADR-016: (1) `eslint` a devDependencies del backend, (2) constante `CTA_LABEL` compartida para "RESERVAR CITA", (3) migración a `next/image`, (4) eliminación de `TICKER_FALLBACK` duplicado, (5) fix de cascada de `.landing-scroll-hint`.

**Por qué se tomó esta decisión:**
Cerrar la deuda técnica documentada para dejar el código limpio y mantenible.

**Impacto en .docs:**
Tabla de deuda del FINAL ADR-016 actualizada (items 1-6 resueltos).

**Impacto en el código:**
`backend/package.json`, `LandingHero.tsx`, `LandingNav.tsx`, `LandingCTA.tsx`, nuevo `landing-text.ts`, `globals.css`.

---

## Mapa de cambios

### Commits creados

| Commit | Mensaje | Contenido |
|--------|---------|-----------|
| `144304a` | `feat: reconstrucción editorial de la landing pública (ADR-016)` | Todo el árbol de trabajo del ADR-016 (código + .docs + reportes + contexto + artefactos) |
| `f474fd1` | `feat: toggle de tema cíclico en dashboards` | `mode-toggle.tsx` |
| `c39d276` | `feat: botón de eliminar en tablas admin (branches/barbers/services/customers)` | 4 páginas admin |
| `6aefae8` | `feat: icono Ban para suspender/activar tenant en super-admin` | tenants + dashboard |
| `1a5d7e0` | `chore: resolución de deuda técnica BAJA del ADR-016` | 5 items de deuda |
| `95f2c1b` | `docs: cierre del ciclo ADR-016 con evidencia de QA runtime` | Reporte + snapshots Playwright |
| `24fff87` | `docs: auditoría del ciclo ADR-016 (APROBADO CON OBSERVACIONES)` | Sección de auditoría inyectada |

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `frontend/src/components/landing/landing-text.ts` | Constante `CTA_LABEL` compartida ("RESERVAR CITA") |
| `reports/2026-08-14_cierre-adr016-ui-dashboards_iter1.md` | Reporte de ejecución + auditoría del ciclo |
| `.playwright-cli/*.yml` | Snapshots de evidencia de QA visual |

### Archivos modificados

| Archivo | Qué cambió |
|---------|-----------|
| `frontend/src/components/theme/mode-toggle.tsx` | DropdownMenu → botón cíclico (light/dark/system) |
| `frontend/src/app/(dashboard)/admin/{branches,barbers,services,customers}/page.tsx` | Botón Trash2 + Dialog confirm + toast |
| `frontend/src/app/(dashboard)/super-admin/{tenants,dashboard}/page.tsx` | Lock/Unlock → Ban |
| `backend/package.json` | `eslint` a devDependencies |
| `frontend/src/components/landing/{LandingHero,LandingNav,LandingCTA}.tsx` | `CTA_LABEL` compartida, `next/image`, eliminar `TICKER_FALLBACK` |
| `frontend/src/app/globals.css` | Fix cascada `.landing-scroll-hint` |
| `.docs/requirements/mvp-scope.md` | ADR-012 y ADR-013 marcados [x] |
| `reports/FINAL_2026-08-10_adr016-landing-editorial.md` | Refleja 2 iteraciones; deuda 1-6 resuelta |

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| ADR-016 commiteado (código + .docs + reportes + contexto) | Cumplido | Commit `144304a`; `git status` limpio |
| mvp-scope.md: ADR-012 y ADR-013 en [x] | Cumplido | 8+8 items marcados |
| Reporte FINAL del ADR-016 refleja 2 iteraciones | Cumplido | Tabla de ciclo + reportes de ejecución |
| ModeToggle: botón cíclico sin desplegable | Cumplido | `mode-toggle.tsx`; QA runtime: ciclo system→light→dark→system |
| Tablas admin: botón eliminar trash funcional | Cumplido | 4 tablas; QA: success (8→7) y error path (RBAC) |
| Super-admin: icono Ban para suspender | Cumplido | tenants + dashboard; tooltips "Suspender"/"Activar" |
| QA visual en runtime con tenant demo | Cumplido | Playwright en `localhost:3001`; landing 8 secciones, sin overflow |
| Deuda técnica BAJA resuelta | Cumplido | 5 items; `npm run lint` backend ejecutable |
| Lint/tsc/tests/build OK | Cumplido | Backend 102/102 tests + build; frontend tsc exit 0 + build |

---

## Observaciones del Auditor (severidad BAJA, no bloqueantes)

| # | Descripción | Archivo | Estado |
|---|-------------|---------|--------|
| 1 | La migración a `next/image` eliminó el handler `onError` que ocultaba una hero-image rota; ahora renderizaría el icono de imagen rota. | `LandingHero.tsx` | ✅ **RESUELTA** en commit `1a334a4` (estado `imgError` + `onError` → fallback tipográfico) |
| 2 | Commit de cierre documental (`95f2c1b`) no previsto en el plan original; sí documentado en "Incidentes y desvíos" (aceptado). | — | Aceptado; trazabilidad completa |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | Bug preexistente `tenantId: ""` en DTOs de creación (detectado en QA, correctamente NO tocado) | BAJA | DTOs de creación | Preexistente; fuera de alcance |

---

## Lo que el programador debe saber

- **El trabajo del ADR-016 quedó commiteado** en un commit atómico (`144304a`) junto con toda la documentación, reportes y artefactos de QA. El árbol de git está limpio.
- **El toggle de tema ahora es un botón que cicla** claro → oscuro → sistema al hacer click, con icono acorde (Sun/Moon/Monitor). Aplica a los 3 dashboards y persiste la selección.
- **Las tablas admin (branches/barbers/services/customers) ahora tienen botón de eliminar** (Trash2) con confirmación y toast. Usan los endpoints DELETE que ya existían en el backend.
- **El candado de suspender/activar tenant se cambió a Ban** para que no se confunda con eliminar. La semántica (suspender ≠ eliminar) se preserva.
- **Deuda técnica BAJA del ADR-016 resuelta**: lint backend ejecutable, constante CTA compartida, `next/image`, ticker sin duplicación, cascada de scroll-hint corregida.
- **QA visual verificado en runtime** con el tenant demo `barberia-el-clasico`: landing con 8 secciones editoriales sin overflow, toggle funcional, delete con success/error path, Ban con tooltips.
- **Observación #1 del Auditor resuelta**: el hero con `next/image` ahora tiene fallback para imagen rota (estado `imgError` + `onError` → se oculta la imagen y se muestra el fallback tipográfico/geométrico). Commit `1a334a4`.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-14_cierre-adr016-ui-dashboards_iter1.md` |