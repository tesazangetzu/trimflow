# Reporte de Ejecución — Modal horarios multi-día (iter 1)

**Fecha:** 2026-08-15
**Agente:** Executor-agent (TRIGGER=ORCHESTRATOR, MODE=AUTO)
**Ámbito:** `frontend/src/app/(dashboard)/admin/schedules/page.tsx`
**Estado:** ✅ COMPLETADO

---

## Plan original (pegado del Planner)

### Objetivo
Ampliar el modal de horarios de barbers en `frontend/src/app/(dashboard)/admin/schedules/page.tsx` de `max-w-2xl` (672px) a `max-w-[820px]`, reorganizar el formulario para aprovechar el ancho (Día | Inicio | Fin | Break inicio | Break fin en una sola fila en desktop), y en modo "Agregar" permitir seleccionar varios días con checkboxes y crear N schedules vía `Promise.all` sin tocar backend.

*(Pasos 1–10 y referencias completas en el prompt del Orquestador; se ejecutan tal cual.)*

### Checklist de trabajo
- [ ] `feat(schedules): ampliar el modal de horarios a max-w-[820px]`
- [ ] `feat(schedules): horario multi-día con checkboxes y creación por lotes (Promise.all)`
- [ ] `test(schedules): cubrir creación multi-día y día bloqueado en edición`

> NOTA: el Orquestador NO ha autorizado commits. No se realizan commits en esta iteración.

---

## Tabla de estado de ejecución

| # | Paso | Estado |
|---|------|--------|
| 1 | Añadir componente `Checkbox` de shadcn | ✅ COMPLETADO |
| 2 | Cambiar ancho del modal `max-w-2xl` → `max-w-[820px]` | ✅ COMPLETADO |
| 3 | Nuevo estado `formDays: number[]` + `toggleDay` | ✅ COMPLETADO |
| 4 | Resetear `formDays` en `openEditor` y `resetForm` | ✅ COMPLETADO |
| 5 | Reorganizar el formulario (editar: 1 fila 5 cols; crear: checkboxes + 4 cols) | ✅ COMPLETADO |
| 6 | Validación `formDays.length === 0` en rama create | ✅ COMPLETADO |
| 7 | `handleSubmit` create → batch `Promise.all` | ✅ COMPLETADO |
| 8 | Tabla de horarios configurados (evaluar; sin trabajo obligatorio) | ✅ COMPLETADO (sin cambios) |
| 9 | Test `page.test.tsx` | ✅ COMPLETADO |
| 10 | Verificación final: `npm run lint` y `npm run test` | ✅ COMPLETADO |

## Registro de commits

- Ninguno. Commits no autorizados por el Orquestador.

## Incidentes y desvíos

1. **Desvío (Paso 1):** El proyecto usa shadcn style `base-nova` (base-ui), no radix. `npx shadcn add checkbox` generó `checkbox.tsx` con `@base-ui/react/checkbox` (dependencia ya presente en `package.json`) en lugar de `@radix-ui/react-checkbox`. API equivalente (`checked`/`onCheckedChange`). No se añadió ninguna dependencia nueva a `package.json`.
2. **Incidente (Paso 9, test):** jsdom no define `PointerEvent`, que el checkbox base-ui usa en su `onClick`. Se añadió un polyfill mínimo de `PointerEvent` en `frontend/jest.setup.ts` (clase que extiende `MouseEvent`). Sin este polyfill, los 3 tests de interacción con checkbox fallan.
3. **Fallos pre-existentes (Paso 10):** `npm run lint` reporta 4 errores y 3 warnings en archivos NO tocados (`BookingWizard.tsx` no-html-link, `use-availability.ts`/`use-public-data.ts`/`use-tenant-name.ts` react-hooks set-state-in-effect, warnings `<img>` en landing). `npm run test` falla solo en `admin/services/page.test.tsx` (4 tests, `useToastManager must be used within <Toast.Provider>`) — verificado pre-existente vía `git stash` (falla sin mis cambios). Ningún fallo pertenece a los archivos modificados/creados por esta iteración.
4. **Desvío (Paso 9, ejecución de jest):** jest CLI no matchea el patrón con paréntesis `(dashboard)`; se usa `--testPathPatterns "schedules/page.test"`.
5. **Riesgo asumido (`Promise.all` sin rollback):** si una de N llamadas `POST /schedules` falla, el catch muestra error genérico sin revertir las previas. Aceptado para MVP (misma semántica que barbería), documentado en el plan original.

## Archivos modificados/creados

- `frontend/src/app/(dashboard)/admin/schedules/page.tsx` — MODIFICADO (pasos 2–7).
- `frontend/src/components/ui/checkbox.tsx` — CREADO (vía `npx shadcn add checkbox`, base-ui).
- `frontend/src/app/(dashboard)/admin/schedules/page.test.tsx` — CREADO (5 tests).
- `frontend/jest.setup.ts` — MODIFICADO (polyfill `PointerEvent` para tests con checkbox base-ui).

## Puntos de validación

1. ✅ Modal ~820px en desktop (`max-w-[820px]`, se conserva `max-h-[calc(100vh-4rem)]` y `overflow-y-auto` — ADR-008).
2. ✅ Edición: Día | Inicio | Fin | Break inicio | Break fin en 1 fila en desktop (`lg:grid-cols-5`); 1 columna en mobile.
3. ✅ Creación: 7 checkboxes en desktop / 4 en mobile (`grid-cols-4 md:grid-cols-7`); con N días → N llamadas `POST /schedules` (verificado por test).
4. ✅ Edición: día bloqueado (select `disabled`), `update` 1 sola llamada (verificado por test).
5. ✅ `formDays` vacío → "Selecciona al menos un día" (verificado por test).
6. ✅ Validaciones de break (ADR-011) intactas — bloque de validación sin cambios.
7. ✅ `npx tsc --noEmit` en verde (exit 0). `npm run lint`/`npm run test` con solo fallos pre-existentes ajenos a esta iteración.

## Comandos de verificación ejecutados (frontend/)

- `npm run lint` → 4 errores + 3 warnings, todos pre-existentes en archivos ajenos.
- `npx tsc --noEmit` → exit 0.
- `npm run test` → 1 suite falla (services, pre-existente), 8 suites pasan. Suite nueva `schedules/page.test.tsx`: 5/5 OK.
- `npx eslint` (solo archivos de esta iteración) → 0 problemas.

---

## Puntos Auditados

**Reporte auditado:** `reports/2026-08-15_modal-horarios-multidia_iter1.md` (iter 1, modal horarios multi-día)
**Fuente de verdad:** `.docs/` (PROJECT.md · mvp-scope.md · modules.md · ADR-007 · ADR-008 · ADR-011)
**Estado del árbol:** sin commits (coherente con directiva del Orquestador); 2 archivos modificados, 3 nuevos.

### Tabla de criterios auditados

| Nivel | Criterio | Fuente en .docs | Veredicto | Commits afectados |
|---|---|---|---|---|
| 1 · Requirements | Gestión de horarios de barbers (asignar horarios/bloques) preservada y extendida a multi-día; no se toca backend | `mvp-scope.md` §"Gestión de barbers" | [✓] | working tree |
| 1 · Requirements | Requisito break (ADR-011) intacto en el formulario | `mvp-scope.md` L47-51 | [✓] | working tree |
| 2 · Architecture | Estructura frontend respetada: página en `app/(dashboard)/admin/`, `checkbox.tsx` en `components/ui/`, `schedules.service.ts` y `types/schedule.ts` sin cambios (verificado vía `git diff`) | `modules.md` L232-261 | [✓] | working tree |
| 2 · Architecture | Modal como patrón CRUD: `Dialog` + mismo service create/update + refresh local de la tabla tras éxito | `modules.md` L14; ADR-008 L14 | [✓] | working tree |
| 3 · ADR-008 | Sigue siendo modal (no convertido a vista); conserva `max-h-[calc(100vh-4rem)]` + `overflow-y-auto` | ADR-008 L11-15, L32-33 | [✓] | working tree |
| 3 · ADR-011 | Validaciones "ambos o ninguno" y "break contenido dentro del turno" preservadas; campos break opcionales (vacíos → `null`) | ADR-011 L36-39 | [✓] | working tree |
| 3 · ADR-007 | Layout con tokens shadcn/ui coherentes (`border-input`, `bg-background`, `bg-muted/30`, `text-destructive`, `shadow-dialog`, `ring-ring`) | ADR-007 L38 | [✓] | working tree |
| 4 · Plan | Modal a `max-w-[820px]` (672→820px, +148px) | Plan paso 2 | [✓] | working tree |
| 4 · Plan | Estado `formDays: number[]` default `[1]`, reseteado en `openEditor` y `resetForm` | Plan pasos 3-4 | [✓] | working tree |
| 4 · Plan | Editar: 5 campos en una fila desktop (`lg:grid-cols-5`) con Día `select disabled` + Inicio + Fin + Break inicio + Break fin | Plan paso 5 | [✓] | working tree |
| 4 · Plan | Crear: bloque 7 checkboxes (`grid-cols-4 md:grid-cols-7`) + fila 4 campos de hora (`lg:grid-cols-4`) | Plan paso 5 | [✓] | working tree |
| 4 · Plan | Helper `toggleDay` + validación "Selecciona al menos un día" solo en rama create (`!editingScheduleId && formDays.length === 0`) | Plan pasos 3, 6 | [✓] | working tree |
| 4 · Plan | Ramas create (`Promise.all(formDays.map(create))`) vs update (1 llamada, sin cambios) correctamente separadas | Plan paso 7 | [✓] | working tree |
| 4 · Plan | Test nuevo `page.test.tsx` con 5 casos: skeleton, render, crear multi-día (create×2), editar (día bloqueado + update×1, sin create), formDays vacío → error | Plan paso 9 | [✓] | working tree |
| 4 · Plan | Verificación ejecutada y confirmada: `tsc --noEmit` exit 0; eslint sobre archivos de la iteración → 0 problemas; suite `schedules/page.test` 5/5 OK | Plan paso 10 | [✓] | working tree |
| 5 · Código | Sin `any`, imports consistentes, validaciones con mensajes en español, `try/catch` con feedback al usuario, `API base-ui` del Checkbox correcta (`checked`/`onCheckedChange` verificado en `@base-ui/react/checkbox/root`) | Protocolo Fase 2 Nivel 5 | [✓] | working tree |
| 5 · Código | `checkbox.tsx`: `<CheckIcon />` en línea separada con indentación anómala (solo cosmético, funcionalmente correcto) | — | [!] | working tree |
| 5 · Código | `Promise.all` del batch sin rollback ante fallo parcial de N llamadas; riesgo aceptado y documentado en el report (incidente 5) | — | [!] | working tree |

### Detalle de fallas

Sin [✗]. Dos observaciones menores, ambas de severidad BAJA, ninguna contraviene decisión documentada en `.docs`:

- **[!] Baja — `frontend/src/components/ui/checkbox.tsx` (L22-23):** el `<CheckIcon />` queda en línea propia con indentación sin sentido. Cosmético; no afecta comportamiento ni accesibilidad. Opcional: colapsar a una línea.
- **[!] Baja — Parcialidad del batch (`page.tsx` L206-218):** si una de N llamadas `POST /schedules` falla, el `catch` muestra error genérico sin revertir las previas. Es el riesgo aceptado explícitamente en el plan original (misma semántica que la creación simple) y no existe ADR que exija transaccionalidad en batch frontend. Al no existir decisión documentada, se reporta como observación/deuda, no como falla.

### Resumen ejecutivo

- **Total criterios auditados:** 18
- **Aprobados [✓]:** 16
- **Observaciones [!]:** 2 (severidad BAJA)
- **Fallidos [✗]:** 0
- **Veredicto global:** **APROBADO CON OBSERVACIONES** (ningún [✗]; observaciones no críticas)
- **Acción requerida:** ninguna bloqueante. Opcional: normalizar formato del `CheckIcon` en `checkbox.tsx`.
- **Deuda técnica registrada:**
  1. Transaccionalidad del batch multi-día (post-MVP: un endpoint batch único en backend eliminaría la parcialidad). Documentado en report incidente 5.
  2. Fallos pre-existentes ajenos a esta iteración, **verificados por auditoría** (stash de `jest.setup.ts` + re-run): 4 errores lint en `BookingWizard.tsx`, `use-availability.ts`, `use-public-data.ts`, `use-tenant-name.ts`, `admin/landing/page.tsx`, `LandingGallery.tsx`; y suite `admin/services/page.test.tsx` (4 tests, `useToastManager must be used within <Toast.Provider>`). El polyfill `PointerEvent` añadido en `jest.setup.ts` **no causa** ese fallo (reproducido sin él). Fuera de alcance de esta iteración.