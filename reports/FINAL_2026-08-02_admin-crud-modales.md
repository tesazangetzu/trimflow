# Reporte Técnico Final
## Migración de CRUD admin a modales + iconos + moneda S/ + skeletons

> **Generado:** 2026-08-02
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.12, React 19.2.4, Tailwind v4, shadcn/ui, @base-ui/react, lucide-react
> **Iteraciones realizadas:** 1
> **Veredicto final:** APROBADO (1 observación BAJA)

---

## Objetivo confirmado

Aplicar a los módulos admin (branches, barbers, services, customers) el patrón ya implementado en super-admin:
1. Crear/editar en **modales** (formularios cortos 4-6 campos) en lugar de vistas `/new` y `/[id]`.
2. Tablas con **botones de icono** (Pencil) con tooltip en lugar de botones de texto "Editar".
3. **Moneda a Soles S/** (antes MXN con `DollarSign`).
4. **Skeletons** en las tablas mientras cargan.

**Éxito cuando:**
- Los 4 módulos abren crear/editar en `Dialog`; las rutas `/new` y `/[id]` ya no existen ni se referencian.
- Las filas usan `Pencil` dentro de `Tooltip`.
- La moneda se muestra como S/ en dashboard y servicios; sin `MXN` ni `DollarSign`.
- Las tablas muestran `SkeletonTable` en load.
- `lint`/`tsc`/`build` pasan.

**Fuera de alcance:** backend, lógica de negocio, `dashboard-shell`.

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | APROBADO             | — (1 observación BAJA no bloqueante) |

---

## Decisiones técnicas tomadas

### 1. Form dialogs unificados create/edit por entidad

**Qué se decidió:** Crear 4 componentes `*FormDialog` (`BranchFormDialog`, `BarberFormDialog`, `ServiceFormDialog`, `CustomerFormDialog`) que manejan tanto creación como edición según la prop `mode`, replicando el patrón de `tenant-form-dialog.tsx`.

**Por qué:** ADR-008 establece que formularios cortos (4-6 campos) deben usar modal, no vista. Unificar create/edit en un solo componente evita duplicación y garantiza consistencia con el patrón ya validado en super-admin.

**Alternativas descartadas:** Mantener vistas `/new` y `/[id]` (viola ADR-008); crear dialogs separados por modo (duplicación innecesaria).

**Impacto en .docs:** Ninguno nuevo; refuerza ADR-008.

**Impacto en el código:** 4 componentes nuevos en `components/{branches,barbers,services,customers}/`; 4 listas reescritas; 8 vistas eliminadas.

### Decision: Moneda S/ (PEN) en `formatCurrency`

**Decisión:** Cambiar `formatCurrency` de `es-MX`/`MXN` a `es-PE`/`PEN` con `maximumFractionDigits: 0`, y usar el helper en el listado de servicios (quitando `DollarSign` + `toLocaleString`).

**Por qué:** El mercado objetivo es peruano (barbería SaaS). `Intl.NumberFormat("es-PE", { currency: "PEN" })` produce `S/ 25`, el formato esperado.

**Alternativas descartadas:** Mantener MXN (incorrecto para el mercado); hardcodear el símbolo `S/` manualmente (menos robusto que Intl).

**Impacto en .docs:** Considerar documentar la moneda PEN en `.docs` (ver deuda técnica).

**Impacto en el código:** `chart-tools.ts`, `services/page.tsx`, y automáticamente `admin/dashboard` y `area-chart` (importan `formatCurrency`).

### Decision: Icono `Coins` en KPI del dashboard admin

**Decisión:** Reemplazar `DollarSign` por `Coins` en el KPI del dashboard admin.

**Por qué:** Decorativo, para eliminar la última referencia a `DollarSign` (heurística de verificación). Aceptable y fuera del alcance estrictamente monetario.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito | Decisión clave asociada |
|---------|-----------|------------------------|
| `frontend/src/components/branches/branch-form-dialog.tsx` | Modal create/edit de sucursales | Formularios unificados |
| `frontend/src/components/barbers/barber-form-dialog.tsx` | Modal create/edit de barberos | Formularios unificados |
| `frontend/src/components/services/service-form-dialog.tsx` | Modal create/edit de servicios | Formularios unificados |
| `frontend/src/components/customers/customer-form-dialog.tsx` | Modal create/edit de clientes | Formularios unificados |

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/app/(dashboard)/admin/branches/page.tsx` | Botón "Nuevo" abre modal; fila con Pencil+tooltip; SkeletonTable; monta BranchFormDialog | Migración a modales |
| `frontend/src/app/(dashboard)/admin/barbers/page.tsx` | Ídem | Migración a modales |
| `frontend/src/app/(dashboard)/admin/services/page.tsx` | Ídem + precio con `formatCurrency` | Migración a modales + moneda |
| `frontend/src/app/(dashboard)/admin/customers/page.tsx` | Ídem | Migración a modales |
| `frontend/src/components/dashboard/chart-tools.ts` | `formatCurrency` → es-PE/PEN | Moneda S/ |
| `frontend/src/app/(dashboard)/admin/dashboard/page.tsx` | Icono KPI `DollarSign` → `Coins` | Limpieza de moneda |

### Archivos eliminados

| Archivo | Motivo |
|---------|--------|
| `admin/branches/new/page.tsx`, `admin/branches/[id]/page.tsx` | Reemplazados por modal |
| `admin/barbers/new/page.tsx`, `admin/barbers/[id]/page.tsx` | Reemplazados por modal |
| `admin/services/new/page.tsx`, `admin/services/[id]/page.tsx` | Reemplazados por modal |
| `admin/customers/new/page.tsx`, `admin/customers/[id]/page.tsx` | Reemplazados por modal |

---

## Cambios en archivos clave

### `frontend/src/components/dashboard/chart-tools.ts`

**Antes:** `formatCurrency` usaba `Intl.NumberFormat("es-MX", { currency: "MXN" })`.
**Después:** `Intl.NumberFormat("es-PE", { currency: "PEN", maximumFractionDigits: 0 })` → `S/ 25`.
**Por qué es importante:** Es el helper central de moneda; su cambio propaga S/ a dashboard y charts automáticamente.

### `frontend/src/app/(dashboard)/admin/services/page.tsx`

**Antes:** Precio con `<DollarSign /> {service.price.toLocaleString()}`.
**Después:** `<Badge>{formatCurrency(service.price)}</Badge>`.
**Por qué es importante:** Centraliza el formato de moneda y elimina la última referencia a `DollarSign`.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Modales en los 4 módulos | Cumplido | `Dialog` en los 4 listados; rutas `/new` y `/[id]` eliminadas sin referencias (grep) |
| Botones de icono con tooltip | Cumplido | `Pencil` + `Tooltip` en los 4 listados |
| Moneda S/ | Cumplido | `formatCurrency` es-PE/PEN; 0 `MXN`/`DollarSign` en src |
| Skeletons en tablas | Cumplido | `SkeletonTable` en load de los 4 listados |
| No se rompe nada | Cumplido | lint/tsc/build limpios |
| Fuera de alcance respetado | Cumplido | Sin cambios en backend ni dashboard-shell |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | Locales mezclados: `es-MX` persiste en `formatDate`/`formatTime`/`DAY_LABELS`/`MONTH_LABELS` mientras la moneda usa `es-PE` | BAJA | `chart-tools.ts` | Baja prioridad |
| 2 | Documentar moneda PEN (S/) en `.docs` | BAJA | `.docs` | Baja prioridad |

---

## Lo que el programador debe saber

- Los 4 módulos admin ahora usan modales para crear/editar; las vistas `/new` y `/[id]` fueron eliminadas.
- La moneda es S/ (PEN) en todo el frontend; el helper `formatCurrency` es la fuente única de formato.
- El patrón de modal unificado (`*FormDialog` con `mode`) es la convención a mantener para futuros CRUD.
- Queda una inconsistencia BAJA de locales (`es-MX` en fechas vs `es-PE` en moneda) en `chart-tools.ts`; se puede unificar en una iteración futura.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-08-02_admin-crud-modales.md` |