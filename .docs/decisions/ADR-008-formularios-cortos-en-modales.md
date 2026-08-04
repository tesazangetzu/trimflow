# ADR-008: Formularios cortos en modales (crear/editar en el mismo contexto)

**Estado:** ACEPTADO
**Fecha:** 2026-08-02

**Contexto:**
Los CRUD del dashboard (tenants, branches, barbers, services, customers) usaban vistas de página para crear (`/super-admin/tenants/new`, etc.) y editar. A la vez, la edición de tenants ya había migrado a un modal. Para formularios de pocos campos (4–6), una vista añade navegación innecesaria (ida y vuelta a la lista) y rompe el contexto de la tabla desde la que se ejecuta la acción, obligando al usuario a abandonar el lugar donde quiere ver reflejado el resultado.

## Decisión

Los formularios de alcance reducido (4–6 campos) se presentan como **modales (`Dialog`)**, tanto para crear como para editar, junto a la tabla o lista de recursos que afectan. Entidades con muchos campos o sub-flujos complejos pueden excepcionalmente usar una vista, justificándolo en la implementación.

- El botón de acción primario abre el modal; no navega a una ruta de creación.
- El modal persiste contra el mismo service que usaba la vista (create/update) y actualiza la tabla localmente tras el éxito.
- Componentes de formulario modales son reutilizables (un solo componente con `mode: "create" | "edit"`) para evitar duplicar campos, labels y helper text.
- Centrado en tenant como primera migración; el resto de entidades del dashboard migrará en iteraciones posteriores.

### Alcance

Entidades cubiertas por esta regla: **tenants, branches, barbers, services, customers**.

Primera migración: **tenant create → modal unificado** (`TenantFormDialog`).

## Consecuencias

### Positivas
- Preserva el contexto de la tabla durante la creación/edición (sin salir de la lista).
- Menos navegación y menos rutas que mantener; UX consecuente.
- UI consistente entre crear y editar (mismo componente, mismo diseño).

### Negativas
- Espacio vertical limitado en un modal; no es apto para formularios muy largos o flujos en múltiples pasos.
- Los formularios extensos pueden requerir scroll dentro del modal, que siempre inferior a una vista dedicada.

## Impacto en .docs

Esta regla queda codificada como ADR y se aplicará a los futuros CRUD del dashboard. Las migraciones de branches, barbers, services y customers a modal quedan registradas como pendientes.