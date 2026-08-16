# Reporte de Ejecución — Página de horarios: cards con búsqueda/paginado + modal solo formulario (iter 1)

**Fecha:** 2026-08-15
**Agente:** Executor-agent (TRIGGER=ORCHESTRATOR, MODE=AUTO)
**Ámbito:** `frontend/src/components/ui/dialog.tsx` · `frontend/src/app/(dashboard)/admin/schedules/page.tsx` · `page.test.tsx`
**Estado:** ✅ COMPLETADO

---

## Plan original (pegado del Planner)

### Objetivo
Convertir la página de horarios del admin en una "tabla de cards" con búsqueda por nombre/email, paginado de 5 por página y tags de horarios clicables que abren el modal en modo edición; reducir el modal a solo el formulario (sin tabla de horarios configurados); y corregir el bug de ancho del `DialogContent` haciendo el ancho configurable vía prop con default `sm:max-w-sm` (retrocompatible).

### Referencias en .docs
- `.docs/PROJECT.md` — filosofía de UX (simplicidad, clean interfaces), stack frontend real.
- `.docs/architecture/modules.md` — estructura del frontend (`components/ui` para shadcn, `app/(dashboard)/admin/`).
- `.docs/decisions/ADR-007-rediseno-ui-dashboards.md` — base visual del dashboard; el cambio no lo contradice.
- `.docs/decisions/ADR-008-formularios-cortos-en-modales.md` — justifica que el modal quede solo con el formulario (crear/editar en el mismo contexto, sin tabla dentro).
- `.docs/decisions/ADR-011-break-horario-barbero.md` — los campos de break del formulario se **conservan intactos**.
- `.docs/requirements/mvp-scope.md` — gestión de horarios de barbers incluida en MVP; no se amplía scope.

### Pasos (resumen)
1. `dialog.tsx`: prop `maxWidth?: string` default `sm:max-w-sm`; base sin `sm:max-w-sm`; `cn(baseClasses, maxWidth, className)`.
2. `page.tsx` DialogContent: quitar `max-w-[820px]`, pasar `maxWidth="sm:max-w-[1000px]"`.
3. Búsqueda: estado `searchTerm`, Input shadcn + icono Search, filtro name/email case-insensitive, reset `page` a 0.
4. Paginado: estado `page` (0-based) + `PAGE_SIZE=5`; `filteredBarbers`, `totalPages`, `safePage`; slice; paginado solo si `totalPages > 1` (patrón dashboard líneas 294-318).
5. Cards: quitar onClick del card, quitar botón ghost footer, icono Pencil derecha del header (aria-label) → `openEditor`.
6. Tags clicables: Button outline con contenido del badge → `startEdit(schedule)` con `e.stopPropagation()`.
7. Modal solo formulario: quitar Separator, tabla de horarios, `DialogFooter`/Cerrar; limpiar imports sin uso.
8. Botón "Eliminar" en modo edición (`variant="destructive"`) → `handleDeleteSchedule(editingScheduleId)` + `resetForm()`.
9. Tests: actualizar/añadir (búsqueda, paginado, tags, modal sin tabla, eliminar).
10. Verificación: `npm run lint`, `npm run test`, `npx tsc --noEmit`; `graphify update .`.

> NOTA: el Orquestador NO ha autorizado commits. No se realizan commits en esta iteración.

---

## Tabla de estado de ejecución

| # | Paso | Estado |
|---|------|--------|
| 1 | `dialog.tsx`: prop `maxWidth` retrocompatible (default `sm:max-w-sm`) | ✅ COMPLETADO |
| 2 | DialogContent de horarios → `maxWidth="sm:max-w-[1000px]"` | ✅ COMPLETADO |
| 3 | Búsqueda por nombre/email con reset de página | ✅ COMPLETADO |
| 4 | Paginado 5 por página + `safePage` + controles | ✅ COMPLETADO |
| 5 | Cards sin click global + icono Pencil (aria-label) | ✅ COMPLETADO |
| 6 | Tags de horarios clicables → modal en edición | ✅ COMPLETADO |
| 7 | Modal solo formulario (sin tabla, sin Separator, sin DialogFooter) | ✅ COMPLETADO |
| 8 | Botón "Eliminar" en modo edición | ✅ COMPLETADO |
| 9 | Tests actualizados y ampliados | ✅ COMPLETADO |
| 10 | Verificación final (lint, test, tsc, graphify) | ✅ COMPLETADO |

## Registro de commits

- Ninguno. Commits no autorizados por el Orquestador.

## Incidentes y desvíos

1. **Desvío (Paso 7):** eliminada la tabla, el estado `editSchedules` quedó sin lecturas → se eliminó el estado y sus 5 `setEditSchedules` (`openEditor`, `startEdit`, `handleSubmit`, `handleDeleteSchedule`). Necesario para pasar el lint; el plan no lo contemplaba explícitamente pero lo indicaba la nota "verificar que queden sin uso los imports y componentes".
2. **Desvío (Paso 6):** `startEdit` cambió de firma a `startEdit(barber, schedule)` y ahora llama `setDialogOpen(true)`. Los tags viven en las cards, fuera del modal, así que la firma original (`startEdit(schedule)`, solo setter de form) no abría el modal. Extensión mínima para cumplir "al hacer click en un tag abre el modal en modo edición".
3. **Desvío (Paso 8):** añadido `handleDeleteFromForm` que llama `handleDeleteSchedule(editingScheduleId)` + `resetForm()` + `setDialogOpen(false)`. El plan asumía que `resetForm()` "cierra el modal al volver a defaults", pero `resetForm` no toca `dialogOpen`; se añadió el cierre explícito para cumplir la intención. Además se añadió `try/catch` con mensaje de error (la tabla vieja no lo tenía).
4. **Desvío (Paso 9, test paginado):** "Página 1 de 1" NO se renderiza porque el paginado solo aparece con `totalPages > 1` (diseño del paso 4). El test se ajustó para verificar el reset de página buscando "barber" (6 resultados → "Página 1 de 2" tras estar en la 2) en lugar de asumir el texto "1 de 1".
5. **Fallos pre-existentes (Paso 10), ajenos a esta iteración:** `npm run lint` → 4 errores + 3 warnings en `use-availability.ts`, `use-public-data.ts`, `use-tenant-name.ts`, `BookingWizard.tsx` y warnings `<img>` de landing (ninguno en archivos tocados, verificado con rg). `npm run test` → 1 suite falla: `admin/services/page.test.tsx` (4 tests, `useToastManager must be used within <Toast.Provider>`). Mismos fallos documentados en la iteración anterior (`2026-08-15_modal-horarios-multidia_iter1.md`, incidente 3).

## Archivos modificados/creados

- `frontend/src/components/ui/dialog.tsx` — MODIFICADO (paso 1: prop `maxWidth` retrocompatible).
- `frontend/src/app/(dashboard)/admin/schedules/page.tsx` — MODIFICADO (pasos 2–8).
- `frontend/src/app/(dashboard)/admin/schedules/page.test.tsx` — MODIFICADO (paso 9: 10 tests).
- `reports/2026-08-15_pagina-horarios-cards_iter1.md` — CREADO (este reporte).
- `graphify-out/` — regenerado vía `graphify update .` (regla del repo).

## Puntos de validación

1. ✅ `DialogContent` sin prop → `maxWidth` default `sm:max-w-sm` (384px). Retrocompatibilidad verificada por grep de los 13 usos: los demás modales pasan `sm:max-w-lg`/`sm:max-w-md` en `className`, que con `twMerge` en `cn()` (última posición) sobreescriben el default.
2. ✅ Modal de horarios → `maxWidth="sm:max-w-[1000px]"` (bug de ancho corregido; se conserva `max-h-[calc(100vh-4rem)]` y scroll — ADR-008).
3. ✅ Búsqueda por nombre y email case-insensitive + reset de página a 0 (test "filtra por nombre y email y resetea la página").
4. ✅ Paginado visible solo con >5 barbers tras el filtro; "Página X de Y" + Anterior/Siguiente con `disabled` en extremos; `safePage` previene fuera de rango (tests de paginado).
5. ✅ Card completo ya no abre el modal; solo el icono Pencil (modo crear) y los tags (modo edición) lo abren.
6. ✅ Modal en modo edición: día bloqueado (select `disabled` con valor correcto), solo horas editables, botón "Eliminar" presente y funcional (tests).
7. ✅ Modal sin tabla de horarios configurados y sin DialogFooter/Cerrar redundante (test "no muestra la tabla...").
8. ✅ Validaciones de break (ADR-011) y creación multi-día (ADR-008) intactas — bloque de formulario sin cambios en esa lógica.

## Comandos de verificación ejecutados (frontend/)

- `npx tsc --noEmit` → exit 0.
- `npx eslint` (solo archivos de esta iteración) → 0 problemas.
- `npm run lint` → 4 errores + 3 warnings, todos pre-existentes en archivos ajenos (verificado con rg).
- `npm run test` → 1 suite falla (services, pre-existente), 8 suites pasan. Suite `schedules/page.test.tsx`: **10/10 OK**.
- `graphify update .` → graph regenerado (3700 nodes, 6142 edges, 251 communities).

---

## Sección de Auditoría (Auditor-agent)

**Fecha:** 2026-08-15 23:32 (-05)
**Agente:** Auditor-agent (TRIGGER=ORCHESTRATOR, MODE=AUTO)

### Criterios validados (orden .docs → plan → código)

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| 1 | .docs/requirements (MVP scope) | ✅ | `mvp-scope.md` incluye "Asignar horarios/bloques de trabajo a barbers" (L30-31) y el break como requisito (L47-51). La iteración solo mejora la UI de `admin/schedules`; no elimina gestión de horarios ni toca backend. Búsqueda/paginado/cards no amplían scope MVP. |
| 2 | .docs/architecture (modules.md) | ✅ | Estructura respetada: página en `app/(dashboard)/admin/`, `dialog.tsx` en `components/ui/` (shadcn), servicios (`schedules.service.ts`/`types/schedule.ts`) sin cambios (verificado vía `git diff` — solo 3 archivos tocados). |
| 3 | .docs/decisions (ADR-007/008/011/017) | ✅ | ADR-007: layout con tokens shadcn/ui (`shadow-card`, `bg-primary/10`, `rounded-4xl`, `text-destructive`), no contradice la base visual. ADR-008: modal solo formulario, sin vista; conserva `max-h-[calc(100vh-4rem)]` + `overflow-y-auto`. ADR-011: campos break y validación "ambos o ninguno" + "contenido dentro del turno" intactos (`page.tsx` L169-184). ADR-017: ajeno a esta iteración, no se tocó. |
| 4 | Plan del Planner (pasos 1-10) | ✅ | Pasos 1-10 implementados y verificados uno a uno (ver desvíos abajo). Paso 1: `dialog.tsx` L42-61, prop `maxWidth = "sm:max-w-sm"`, base sin `sm:max-w-sm`, `cn(base, maxWidth, className)`. Paso 2: `page.tsx` L444 `maxWidth="sm:max-w-[1000px]"`. Paso 3: L74, L316-329, L250-254 (filtro case-insensitive + reset de página). Paso 4: L41, L75, L255-260, L412 (paginado solo con `totalPages > 1`). Paso 5: cards sin onClick global + Pencil con `aria-label` (L366-374). Paso 6: tags Button outline `startEdit(barber, s)` (L384-398). Paso 7: modal sin Separator/tabla/DialogFooter (removidos en diff). Paso 8: botón Eliminar `variant="destructive"` (L556-567). Paso 9: tests. Paso 10: verificación. |
| 5 | Código en frontend/src/ | ✅ | Leídos los 3 archivos y contrastados con el diff real. `cn()` usa `twMerge` (`lib/utils.ts` L5), `maxWidth` va antes de `className` → los 13 usos pre-existentes mantienen ancho: 12 pasan `sm:max-w-lg`/`sm:max-w-md` en `className` (ganan por twMerge); 1 (`barber/schedule/blocks/page.tsx` L291) sin clase de ancho conserva el default `sm:max-w-sm` (comportamiento idéntico al previo). Sin `any`, imports consistentes y sin imports muertos (`editSchedules`, `Separator`, `Table`, `DialogFooter`, `Coffee` → 0 coincidencias en `page.tsx`). |
| 6 | Tests (10/10 suite schedules) | ✅ | Re-ejecutado `npx jest --testPathPatterns "schedules/page.test"` → **10 passed / 10 total**. Cubren: skeleton, render, crear multi-día (create×2), tag→modo edición (día bloqueado), update×1 sin create, error sin días, búsqueda+reset página, paginado solo >5, eliminar desde modal, modal sin tabla/Cerrar. |
| 7 | tsc --noEmit / lint en archivos tocados | ✅ | `npx tsc --noEmit` → exit 0 (re-ejecutado). `npx eslint` sobre los 3 archivos tocados → 0 problemas (re-ejecutado). `npm run lint` completo: 4 errores + 3 warnings, todos en archivos ajenos (`admin/landing/page.tsx`, `BookingWizard.tsx`, `LandingGallery.tsx`, `use-availability.ts`, `use-public-data.ts`, `use-tenant-name.ts`), verificados con `rg`; `git status` confirma que ningún archivo ajeno está modificado. Suite que falla (`admin/services/page.test.tsx`, `useToastManager must be used within <Toast.Provider>`) también pre-existente (documentada en la iteración anterior). |

### Fallas encontradas

1. **Criterio 5 · severidad BAJA — código muerto defensivo en `page.tsx` (L390-391):** `e.stopPropagation()` en el onClick de los tags quedó redundante porque el paso 5 eliminó el onClick global del card (ya no hay evento que propagar). El plan original (paso 6) pedía explícitamente `stopPropagation`, y su mantención es inofensiva, pero hoy es código muerto. Corrección sugerida (opcional): eliminarlo en una iteración futura al tocar la página.

2. **Criterio 4 · severidad BAJA — desvíos documentados del plan (reporte L60-64):** (a) eliminación de `editSchedules` y sus 5 setters (necesario para pasar lint; coherente con "limpiar imports sin uso"); (b) `startEdit(barber, schedule)` + `setDialogOpen(true)` (los tags viven en las cards, fuera del modal; extensión mínima para cumplir el objetivo); (c) `handleDeleteFromForm` con `setDialogOpen(false)` explícito (el plan asumía que `resetForm` cierra el modal, pero no toca `dialogOpen`); (d) ajuste del test de paginado ("Página 1 de 1" no se renderiza por diseño del paso 4). Ninguno contradice `.docs`; se validan como razonables y mejoran el cumplimiento de la intención del plan.

3. **Criterio 4 · severidad BAJA — disparidad en métrica de graphify (reporte L91):** "251 communities" no es verificable desde `graphify-out/.graphify_analysis.json` (artefacto de 2026-08-07 con 150 comunidades, sin regenerar). No obstante, `graph.json` regenerado hoy a las 12:45 con `built_at_commit` = último commit y **3700 nodes / 6142 links coinciden exactamente**, probando que `graphify update .` se ejecutó. Dato cosmético de reporte, sin impacto funcional.

### Veredicto

**APROBADO CON OBSERVACIONES**

La implementación cumple íntegramente los pasos 1-10 del plan, respeta las fuentes de verdad de `.docs` (MVP scope, estructura frontend, ADR-007/008/011 intactos, ADR-017 no tocado) y las afirmaciones del reporte se verificaron re-ejecutando `tsc`, eslint, la suite `schedules/page.test` (10/10) y el lint completo (fallos pre-existentes ajenos confirmados). No hay fallas de severidad CRÍTICA/ALTA/MEDIA; las 3 observaciones son BAJA y no bloqueantes (código muerto defensivo opcional de limpiar, desvíos del plan razonables y mejor documentados, y un dato cosmético del reporte). Retrocompatibilidad de `dialog.tsx` verificada contra los 13 usos existentes (twMerge en `cn()` con `maxWidth` antes de `className`).