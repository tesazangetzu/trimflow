# ADR-007: Rediseño de UI de los Dashboards (inspirado en Admindek Next)

**Estado:** ACEPTADO
**Fecha:** 2026-08-01

**Contexto:**
Los 3 dashboards de TrimFlow (admin, barber, super-admin) necesitan un rediseño de UI que unifique su apariencia con una estructura profesional y moderna. Se seleccionó como referencia visual el template de dashboard "Admindek Next" (https://admindek-next.dashboardpack.com/dashboard/analytics), que ofrece un layout SaaS con sidebar colapsable, header sticky con blur, cards KPI con sparklines, charts (recharts), tabla de transacciones, dark mode y tokens de tema coherentes.

El stack frontend REAL (verificado en `frontend/package.json`) es Next.js 16.2.12, React 19.2.4, TypeScript 5.x, Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui (components.json presente), lucide-react, @base-ui/react, @radix-ui/react-label, @radix-ui/react-slot, class-variance-authority, tailwind-merge, clsx y tw-animate-css. **recharts NO está instalado actualmente.** La estructura de carpetas del frontend ya está definida en `modules.md` (`app/`, `components/ui`, `components/layouts` por rol, `lib/`, `services/`, `hooks/`, `types/`) y el rediseño debe encajar en ella sin contradecirla.

## Decisión

Se adopta un rediseño de UI "inspirado en" Admindek Next para los 3 dashboards, replicando su estructura visual y tokens de tema con **componentes propios escritos desde cero**, usando datos reales de la API de TrimFlow.

### Alcance

- Aplicar el layout Admindek a los 3 dashboards (admin, barber, super-admin), conservando los menús y rutas actuales de cada rol.
- Sidebar colapsable, header sticky con blur y dark mode con toggle.
- Cards KPI con sparklines, chart principal (línea/área), donut de dispositivos, mapa mundial y tabla de transacciones.
- Charts implementados con **recharts** (misma librería que usa el template), consumiendo datos reales de la API.
- NO crear páginas nuevas del template que no existan en TrimFlow.
- NO tocar el backend ni cambiar la API de datos.

### Paleta de tema (ocean-blue por defecto)

Tokens aplicados a las variables CSS de shadcn/ui en light y dark:

| Token | Light | Dark |
|-------|-------|------|
| Primary (ocean-blue) | `#4680ff` | `#4680ff` |
| Secondary accent (royal-purple) | `#7c4dff` | `#7c4dff` |
| Accent (rose-pink) | `#e91e63` | `#e91e63` |
| Navy (sidebars/header dark) | `#34495e` | `#34495e` |
| background | blanco | oscuro (derivado de navy) |
| card | blanco | gris oscuro |
| muted-foreground | gris | gris claro |

Los tokens siguen la convención moderna de shadcn/ui observada en el template: `bg-background`, `bg-card`, `text-muted-foreground`, `border-sidebar-primary`, `bg-success`, `data-slot="card"`, etc. Se replican como tokens propios sin copiar el CSS fuente del template.

### Dark mode

Se implementa dark mode con toggle en el header mediante **next-themes** (mecanismo coherente con Next.js App Router y shadcn/ui). La selección persiste por usuario y respeta la preferencia del sistema por defecto.

### Charts con recharts (nueva dependencia)

`recharts` se incorpora como dependencia de producción del frontend. El template usa recharts, y es la librería estándar del ecosistema React para charts declarativos. Cubre: chart principal, donut de dispositivos y sparklines de KPI cards. El mapa mundial se implementa con componentes propios (posiciones geográficas + tabla/lista de ubicaciones) sin depender de librerías del template.

## Consecuencias

### Positivas

- UI unificada y profesional en los 3 dashboards con identidad visual coherente.
- Tokens de tema centralizados (shadcn/ui) que facilitan cambios globales de marca y dark mode.
- Dashboard como vitrina del SaaS: mejora la percepción del producto frente a clientes.
- recharts es ampliamente documentado, estable y fácil de mantener.
- Los 3 roles comparten la misma base de layout y componentes, reduciendo duplicación.

### Negativas

- Costo de implementación: escribir todos los componentes desde cero (no se copia el template) implica esfuerzo de desarrollo considerable.
- Dependencia nueva (recharts) agrega peso al bundle del frontend.
- El "inspirado en" con componentes propios puede generar pequeñas diferencias visuales frente al template original.
- El dark mode duplica el mantenimiento de tokens de color (light + dark).
- Los datos reales de TrimFlow pueden no llenar visualmente todos los KPIs del template; se adaptarán a los datos disponibles.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Copiar archivos fuente del template** | Prohibido por licencia. Replica "inspirada en", nunca copia. |
| **shadcn/ui dark mode por clases (sin next-themes)** | next-themes es el mecanismo estándar con App Router y evita FOUC. |
| **chart.js / apexcharts** | El template usa recharts; no se justifica una librería distinta. |
| **Componentes de gráficos propios (SVG a mano)** | Mayor costo de mantenimiento y menos robusto que recharts. |
| **Aplicar el rediseño solo a un dashboard** | Inconsistencia entre roles; la meta es unificar los 3. |

## Impacto en .docs

- `PROJECT.md`: la tabla de stack del frontend se actualiza a las versiones reales (Next.js 16.2.x, React 19.x, Tailwind CSS 4.x, lucide-react) y se añade `recharts` como dependencia prevista.
- `architecture/modules.md`: el rediseño encaja en el paralelo estructural del frontend ya definido (components/layouts por rol, lib/, services/, hooks/); no requiere cambios estructurales.
- Este ADR sirve de guía de referencia para la implementación del rediseño de UI de los dashboards.
