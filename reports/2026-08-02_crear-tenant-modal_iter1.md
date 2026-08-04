# Reporte de Ejecución — Crear Tenant en Modal (Iteración 1)

Fecha: 2026-08-02
Agente: Ejecución (ORCHESTRATOR MODE=AUTO)

## Resumen

Se migró la creación de tenants de una vista (`/super-admin/tenants/new`) a un modal, y se unificó el formulario de crear/editar en un único componente reutilizable con diseño mejorado (espaciado, labels, helper text, copy accionable). La regla "formularios cortos → modal" quedó documentada en `.docs` como ADR-008.

## Criterios de éxito
- [x] El botón "Nuevo Tenant" ahora es un `Button` que abre un modal de creación (ya no navega).
- [x] El modal de creación persiste vía `tenantsService.create` (POST /tenants) y actualiza la tabla localmente.
- [x] Diseño de modales mejorado.
- [x] La vista `/super-admin/tenants/new` se eliminó (archivo + carpeta) y quedan 0 referencias.
- [x] Regla documentada en `.docs/decisions/ADR-008-formularios-cortos-en-modales.md`.

## Archivos creados
- `frontend/src/components/tenants/tenant-form-dialog.tsx` — Componente unificado que maneja create y edit. API `{ mode: "create" | "edit", open, onOpenChange, tenant?, onCreated?, onSaved? }`. create → `tenantsService.create`, edit → `tenantsService.update`. Cierra el modal y emite toasts coherentes ("Tenant creado"/"Cambios guardados"). Reset por apertura vía hijo montado solo cuando `open && (create || tenant)` (evita setState-in-effect del lint). Header con `DialogTitle` y `DialogDescription` accionables; footer `Cancelar` (outline, disabled en loading) + primario accionable ("Crear tenant"/"Guardar cambios" → "Creando..."/"Guardando...").
- `.docs/decisions/ADR-008-formularios-cortos-en-modales.md` — ADR que codifica la regla: formularios de 4–6 campos se presentan como modales, no vistas. Alcance: tenants, branches, barbers, services, customers. Primera migración: tenant create → modal unificado.

## Archivos modificados
- `frontend/src/app/(dashboard)/super-admin/tenants/page.tsx` — Quitado `Link` y su import; el botón "Nuevo Tenant" ahora es `<Button onClick={() => setCreateOpen(true)}>`. Se añadió estado `createOpen`, `handleCreated` (inserta creado y ordena por nombre). Reemplazado `EditTenantDialog` por dos instancias de `TenantFormDialog` (create y edit). Import actualizado.

## Archivos eliminados
- `frontend/src/app/(dashboard)/super-admin/tenants/new/page.tsx` (+ carpeta `new/`).

## Decisiones
- **Componente unificado**: un solo `TenantFormDialog` con `mode` en vez de mantener `EditTenantDialog` separado + una vista de creación; evita duplicar campos/labels/helper text.
- **`edit-tenant-dialog.tsx` NO se eliminó**: sigue usado por el dashboard (`super-admin/dashboard/page.tsx`). Se mantiene para no romper esa ruta; la unificación del dashboard queda como migración futura (ADR-008).
- **Error en slug**: se limpia el error al editar el slug y `aria-invalid` se marca si hay error.
- **Artefacto stale de `.next`**: `npx tsc --noEmit` tras borrar la vista fallaba por un tipo generado que referenciaba `super-admin/tenants/new`; se regeneró con `npm run build` (la ruta ya no aparece) y tsc pasó.

## Verificación
- `npm run lint` → ✅ sin errores ni avisos.
- `npm run build` → ✅ compila; `/super-admin/tenants/new` ya no está entre las rutas (solo `/super-admin/tenants` y `/super-admin/tenants/[id]`).
- `npx tsc --noEmit` → ✅ exit 0.
- `rg "tenants/new" frontend/src` → ✅ 0 resultados (sin contar artefactos `.next`).
- Confirmado que "Nuevo Tenant" abre modal (Button, no navegación).

## Fuera de alcance respetado
- No se modificó backend.
- No se convirtió a modal branches/barbers/services/customers.
- No se tocó la lógica de activar/suspender.

---

# Iteración 2 (unificación)

Fecha: 2026-08-02
Agente: Ejecución (ORCHESTRATOR MODE=AUTO)

## Resumen

Corrección de falla MEDIA del Auditor: el dashboard (`super-admin/dashboard/page.tsx`) seguía usando el `EditTenantDialog` antiguo (diseño no mejorado), rompiendo la consistencia de diseño con la lista de tenants que ya usa el `TenantFormDialog` unificado. Se unificó el dashboard bajo `TenantFormDialog` y se eliminó el componente antiguo. Esto además cierra la deuda documentada en la decisión de la Iteración 1 ("la unificación del dashboard queda como migración futura").

## Archivos modificados
- `frontend/src/app/(dashboard)/super-admin/dashboard/page.tsx` — Import cambiado de `EditTenantDialog` a `TenantFormDialog`. El uso pasó a `<TenantFormDialog mode="edit" tenant={editingTenant} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={handleSaved} />`. No se tocó nada más (handleEdit, handleSaved, editingTenant, dialogOpen ya eran compatibles con la API).

## Archivos eliminados
- `frontend/src/components/tenants/edit-tenant-dialog.tsx` — Ya no se usa; `TenantFormDialog` (mode="edit") lo reemplaza por completo.

## Verificación
- `rg "edit-tenant-dialog" frontend/src` → ✅ 0 resultados.
- `npm run lint` → ✅ sin errores ni avisos.
- `npx tsc --noEmit` → ✅ exit 0.

## Fuera de alcance respetado
- No se modificó la lógica de activar/suspender ni ningún otro apartado del dashboard.