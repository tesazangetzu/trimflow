# UI Specification — Dashboard Figma Design

> **File:** `Dashboad new` (key: `JWsJybEDFMTZRt9XG7qg67`)
> **Generated:** 2026-07-30
> **Stack:** Next.js 16 + Tailwind CSS v4 + shadcn/ui

---

## 1. Design Tokens

### Colors

| Token | Figma Value | CSS Variable | Hex |
|-------|------------|-------------|-----|
| Indigo (primary) | `0.352, 0.414, 0.812` | `--color-figma-indigo` | `#5A6ACF` |
| Indigo soft | `0.867, 0.895, 0.942` | `--color-figma-indigo-soft` | `#DDDCF0` |
| Surface (card bg) | `0.983, 0.987, 0.996` | `--color-figma-surface` | `#FBF5FE` |
| Separator | `0.783, 0.795, 0.850` | `--color-figma-separator` | `#C8CAD9` |
| Line light | `0.886, 0.906, 0.906` | `--color-figma-line-dash` | `#E2E7E7` |
| Muted text | `0.451, 0.482, 0.545` | `--color-figma-muted` | `#737B8B` |
| Text dark | `0, 0, 0` | `--color-figma-text-dark` | `#121212` |
| Success | `0.196, 0.819, 0.427` | `--color-figma-success` | `#32D16D` |
| Success dark | `0.078, 0.616, 0.322` | `--color-figma-success-dark` | `#149D52` |
| Danger | `0.949, 0.220, 0.227` | `--color-figma-danger` | `#F2383A` |
| Chart orange | — | `--color-figma-chart-orange` | `#F99C2F` |
| Chart indigo | — | `--color-figma-chart-indigo` | `#6463D6` |
| Chart cyan | — | `--color-figma-chart-cyan` | `#2FBFDE` |

### Typography

| Element | Family | Weight | Size | Spacing | Opacity |
|---------|--------|--------|------|---------|---------|
| Title Data | Poppins | Regular (400) | 14px | 0.5px | 100% |
| Number (KPI) | Poppins | Medium (500) | 20px | 0.5px | 100% |
| View Report btn | Poppins | Medium (500) | 12px | 0.5px | 100% |
| Step label (01-06) | Poppins | Regular (400) | 11px | 0.5px | 50% |
| Description | Poppins | Regular (400) | 13px | 0.5px | 50% |
| Legend | Poppins | Regular (400) | 12px | 0.5px | 70% |
| Trend % | Poppins | SemiBold (600) | 12px | 0.5px | 100% |
| Card heading | Poppins | Medium (500) | 14px | 0.5px | 100% |

### Spacing & Sizing

| Element | Width | Height | Border Radius | Shadow |
|---------|-------|--------|--------------|--------|
| Card | auto | auto | `rounded-xl` (shadcn) | `0 1px 3px rgba(0,0,0,0.06)` + `0 1px 2px rgba(0,0,0,0.04)` |
| Button (View Report) | 109px | 32px | 5px (`rounded-md`) | `0 2px 1px rgba(64,72,82,0.05)` |
| Legend dot | 9px | 9px | 50% (circle) | — |
| Avatar (food list) | 40px | 40px | 50% (circle) | — |
| Separator line | full | 0.5px | — | — |

---

## 2. Component Architecture

### Component Tree

```
Dashboard (admin/dashboard)
├── Header (icon + title + description)
├── KPI Row (4× StatCard)
│   ├── StatCard (Citas Hoy) — with trend
│   ├── StatCard (Barbers)
│   ├── StatCard (Clientes)
│   └── StatCard (Servicios)
├── Row 1 (3-col grid)
│   ├── OrderStats (col-span-2) — chart + steps + trend
│   └── MostOrdered — food list with avatars
├── Row 2 (3-col grid)
│   ├── RatingCharts — 3 donut charts
│   ├── OrderTime — time distribution
│   └── QuickSummary — resumen card
```

### Reusable Components Created

| Component | File | Props | Figma Match |
|-----------|------|-------|-------------|
| `StatCard` | `components/dashboard/stat-card.tsx` | `label, value, icon, trend?, className` | KPI stat cards |
| `OrderStats` | `components/dashboard/order-stats.tsx` | `totalOrders, trend, trendDirection, className` | "Order Stats" panel |
| `MostOrdered` | `components/dashboard/most-ordered.tsx` | `items: FoodItem[], className` | "Most Ordered Food" list |
| `RatingCharts` | `components/dashboard/rating-charts.tsx` | `metrics: RatingMetric[], className` | "Your Rating" donuts |
| `OrderTime` | `components/dashboard/order-time.tsx` | `slots: TimeSlot[], className` | "Order Time" distribution |

---

## 3. Layout Grid (Figma Reference)

The Figma frame `.` is 362×322px with absolute positioning. In responsive Tailwind:

- **Desktop (lg+):** 3-column grid (`lg:grid-cols-3`) with `OrderStats` spanning 2 cols
- **Mobile/Tablet:** Single column stack
- **KPI row:** 4-column on desktop (`lg:grid-cols-4`), 2 on tablet (`sm:grid-cols-2`), 1 on mobile

---

## 4. Sidebar Navigation (Figma Reference)

The Figma sidebar uses Iconly icons for:
1. Dashboard (Chart)
2. Order Management (Buy)
3. Menu (Document)
4. Nutrition (Chat)
5. Promo (Wallet)
6. Report (Document)
7. Stock (Info Square)
8. Settings (Setting)

Current admin layout maps to:
1. Dashboard → `LayoutDashboard`
2. Sucursales → `Store`
3. Barbers → `UserCog`
4. Horarios → `CalendarDays`
5. Servicios → `Scissors`
6. Clientes → `Users`
7. Citas → `CalendarCheck`

---

## 5. Responsive Behavior

| Breakpoint | KPI row | Dashboard grid |
|-----------|---------|----------------|
| < 640px | 1 column | 1 column |
| ≥ 640px (sm) | 2 columns | 1 column |
| ≥ 1024px (lg) | 4 columns | 3 columns |
