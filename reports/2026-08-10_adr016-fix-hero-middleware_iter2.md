# Reporte Técnico
## Fix de verificación runtime — Hero invisible y redirección en reserva (ADR-016, iteración 2)

> **Generado:** 2026-08-10
> **Proyecto:** TrimFlow
> **Rol:** Executor-agente (Modo AUTO)
> **Alcance:** `frontend/src/components/landing/LandingHero.tsx` y `frontend/src/middleware.ts`
> **Veredicto:** ✅ COMPLETADO

---

## Resumen de cambios

### Bug 1 — Hero invisible (textos con `opacity: 0` permanente)

En `LandingHero.tsx` el ref `bodyRef` estaba asignado al **div interno** de contenido, pero el CSS de `globals.css` espera la clase `is-ready` en el elemento con clase `landing-hero` (el `<header>`):

```css
.landing-hero-block { opacity: 0; }
.landing-hero.is-ready .landing-hero-block { animation: landing-rise 0.7s ... both; }
```

El `useEffect` añadía `is-ready` al div interno → el selector `.landing-hero.is-ready .landing-hero-block` nunca coincidía → los bloques quedaban con `opacity: 0` y el contenido del hero era invisible en el DOM.

**Corrección aplicada** (mínimo cambio, respetando el CSS existente):
- `bodyRef` se movió del div interno al `<header className="landing-hero">`.
- El tipo del ref se actualizó a `useRef<HTMLElement>(null)` (el `<header>` no tiene interfaz HTML específica).
- El `useEffect` con `requestAnimationFrame` y el cleanup (`cancelAnimationFrame`) quedaron intactos; solo cambia el elemento sobre el que se añade `is-ready`.

### Bug 2 — Botones de reserva redirigían a `/login`

En `middleware.ts` la regla de rutas públicas de la landing solo permitía **1 segmento** (`/[slug]`, sin colisión con `RESERVED_ROOTS`). La ruta `/[slug]/reservar` tiene **2 segmentos** → no entraba en la regla, no estaba en `publicPaths` y sin token caía en `redirect("/login")`.

**Corrección aplicada:** se amplió la regla de la landing para aceptar también el segundo segmento `reservar`:

```ts
const segments = pathname.split("/").filter(Boolean)
if (
  segments.length === 1 && !RESERVED_ROOTS.has(segments[0])
  || segments.length === 2 && segments[1] === "reservar" && !RESERVED_ROOTS.has(segments[0])
) {
  return NextResponse.next()
}
```

Se mantuvieron intactas las demás reglas (login/register, protecciones por rol de dashboard, redirecciones) y el matcher.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/landing/LandingHero.tsx` | `ref` movido al `<header>` (`landing-hero`); tipo del ref a `useRef<HTMLElement>(null)` |
| `frontend/src/middleware.ts` | Ruta pública `/[slug]/reservar` permitida en la regla de la landing |

## Verificaciones ejecutadas

| Verificación | Comando | Resultado |
|--------------|---------|-----------|
| Typecheck | `npx tsc --noEmit` (frontend/) | ✅ Sin errores |
| Lint (archivos tocados) | `npx eslint src/middleware.ts src/components/landing/LandingHero.tsx` | ✅ 0 errores (1 warning pre-existente de `<img>`, ajeno al cambio) |
| Lint (proyecto) | `npm run lint` (frontend/) | ⚠️ 3 errores **pre-existentes** en archivos NO tocados (`BookingWizard.tsx`, `use-availability.ts`, `use-public-data.ts`); sin errores nuevos introducidos |
| Build | `npm run build` (frontend/) | ✅ Compila y genera páginas correctamente (incluye `/[slug]` y `/[slug]/reservar`) |
| Reserva pública | `curl -o /dev/null -w "%{http_code}" http://localhost:3001/barberia-el-clasico/reservar` | ✅ **200** (antes 307 → `/login`) |
| Landing pública | `curl -o /dev/null -w "%{http_code}" http://localhost:3001/barberia-el-clasico` | ✅ 200 |
| Hero: selector válido | Revisión de código: `is-ready` se añade vía `requestAnimationFrame` al `<header>` con clase `landing-hero` (LandingHero.tsx:30,36) y el selector `.landing-hero.is-ready .landing-hero-block` (globals.css:543) ahora coincide | ✅ Correcto |
| Knowledge graph | `graphify update .` | ✅ 3507 nodos, 5904 aristas, 239 comunidades |

> Nota sobre la verificación funcional del hero: el contenido de la landing se renderiza en cliente (fetch en `useEffect` de `usePublicData`), por lo que la clase `is-ready` no aparece en el HTML estático servido por `curl`; se verifica por revisión de código (vía permitida explícitamente). El route `/[slug]/reservar` ya devolvía **200** con el middleware corregido, confirmando que la regla pública ampliada está activa en el dev server.

## Estado

✅ **COMPLETADO**

## Fuera de alcance (no modificado)

- `.docs/`
- Lógica de reservas, `BookingWizard`, endpoints públicos
- Reglas del middleware ajenas a la ruta pública de la landing
- El warning `<img>` de `LandingHero.tsx` (pre-existente, fuera del alcance de la corrección)

---

## Auditoría

Auditoría del Auditor-agent sobre la iteración 2 de ADR-016 (`reports/2026-08-10_adr016-fix-hero-middleware_iter2.md`) contra el reporte del Executor y el código real.

### 1. Bug 1 — Hero invisible (opacity: 0 permanente)

**Causa raíz confirmada.** En la iteración 1, `bodyRef` estaba asignado al `<div>` interno de contenido (no al `<header className="landing-hero">`), por lo que el `useEffect` añadía `is-ready` a un elemento cuyo selector no consume el CSS. Con `useRef<HTMLDivElement>(null)` el ref solo podía apuntar a un `<div>`, imposibilitando el fix en el header. ✔

**Fix verificado en código (`frontend/src/components/landing/LandingHero.tsx`):**
- `bodyRef = useRef<HTMLElement>(null)` (L22) — tipo ampliado a `HTMLElement`, necesario para el `<header>`.
- `ref={bodyRef}` sobre `<header className="landing-hero ...">` (L35–36) — el ref ahora apunta al elemento con la clase que consume el CSS.
- `useEffect` intacto (L28–32): bail-out por `prefers-reduced-motion`, añade `is-ready` vía `requestAnimationFrame`, cleanup con `cancelAnimationFrame`. ✔
- El selector `.landing-hero.is-ready .landing-hero-block` (`globals.css:543`) ahora coincide → la animación `landing-rise` (fade+rise, `both`) se dispara y los bloques terminan en `opacity: 1`. Los bloques ya no quedan ocultos permanentemente. ✔

**prefers-reduced-motion sin regresión:** en `globals.css:560–563` el bloque `@media (prefers-reduced-motion: reduce)` cubre **ambas** variantes — `.landing-hero.is-ready .landing-hero-block` y `.landing-hero .landing-hero-block` (sin `is-ready`) — con `animation: none; opacity: 1`. Aunque el `useEffect` haga early-return y nunca añada `is-ready`, los bloques quedan visibles. ✔

### 2. Bug 2 — Ruta pública `/[slug]/reservar`

**Fix verificado (`frontend/src/middleware.ts:22–28`):**

```ts
const segments = pathname.split("/").filter(Boolean)
if (
  segments.length === 1 && !RESERVED_ROOTS.has(segments[0])
  || segments.length === 2 && segments[1] === "reservar" && !RESERVED_ROOTS.has(segments[0])
) {
  return NextResponse.next()
}
```

- Precedencia correcta (`&&` liga más que `||`): equivale a `(A && B) || (C && D && E)`. ✔
- Acepta `/[slug]` (1 segmento) y `/[slug]/reservar` (2 segmentos, segundo = `reservar`), excluyendo raíces reservadas. ✔
- **Colisión con `RESERVED_ROOTS`**: `["login", "register", "admin", "barber", "super-admin"]` intacto (L13). `/login`, `/register`, `/admin/reservar`, `/barber/reservar`, etc. **no** entran en la regla pública (segments[0] reservado) y caen a las reglas siguientes. ✔
- **Reglas intactas**: `publicPaths` login/register con redirect por rol si hay token (L30–39); `!token → /login` (L41–43); rol inválido → `/login` (L45–48); protecciones por rol de dashboards (L50–60). ✔
- **Matcher sin cambios** (L74–76): `["/((?!_next/static|_next/image|favicon.ico).*)"]`. ✔

### 3. Sin regresiones (verificado por el Auditor)

| Verificación | Comando | Resultado (Auditor) |
|--------------|---------|----------------------|
| Typecheck | `npx tsc --noEmit` (frontend/) | ✅ Exit 0 |
| Lint (2 archivos tocados) | `npx eslint src/middleware.ts src/components/landing/LandingHero.tsx` | ✅ 0 errores; 1 warning `<img>` pre-existente en `LandingHero.tsx:43` |
| Build | `npm run build` (frontend/) | ✅ Exit 0 — incluye rutas dinámicas `/[slug]` y `/[slug]/reservar` + «ƒ Proxy (Middleware)» |
| Reserva pública (runtime) | `curl -o /dev/null -w "%{http_code}" http://localhost:3001/barberia-el-clasico/reservar` | ✅ **200** (el reporte indicaba 307 → `/login` antes del fix) |
| Landing pública (runtime) | `curl ... /barberia-el-clasico` | ✅ **200** |

### 4. Restricciones

- `.docs/`: las modificaciones en el working tree son del ciclo documental del Orquestador (cierre de iteración 1, ADR-013/015/016) — **previas** a esta iteración de fix, que solo toca los 2 archivos de código. ✔
- `BookingWizard`, endpoints públicos y lógica de reservas: **sin cambios** (`git status` no muestra ningún archivo de esos dominios). ✔
- El único diff de la iteración 2 está en `LandingHero.tsx` (movimiento del ref + tipo) y `middleware.ts` (regla ampliada); coherente con el reporte del Executor. ✔

### 5. Hallazgos

No se detectó falla funcional, de cumplimiento ni de restricción. Solo observaciones de legibilidad (ver tabla).

## Veredicto del Auditor

**Veredicto:** ✅ APROBADO

### Fallas (si las hay)

Sin fallas bloqueantes.

| # | Criterio | Severidad | Problema | Archivo | Corrección propuesta |
|---|----------|-----------|----------|---------|---------------------|

### Observaciones no bloqueantes (si las hay)

| # | Descripción | Severidad | Archivo |
|---|-------------|-----------|---------|
| 1 | La condición de la regla pública mezcla `&&`/`||` sin paréntesis. Es correcta por precedencia de JavaScript (`&&` liga más que `||`), pero los paréntesis explícitos reducirían el riesgo de regresión en ediciones futuras. | Muy baja | `frontend/src/middleware.ts:23–26` |
| 2 | El warning `@next/next/no-img-element` en `LandingHero.tsx:43` (el `<img>` del hero) persiste como pre-existente; fuera del alcance del fix (iteración de corrección funcional). Migrable a `next/image` en un ciclo posterior. | Muy baja | `frontend/src/components/landing/LandingHero.tsx` |

### Criterios verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| 1. Bug 1: `ref` en `<header className="landing-hero">`; `useEffect` añade `is-ready` al header; selector `.landing-hero.is-ready .landing-hero-block` coincide; bloques ya no en `opacity: 0` permanente | ✔ CUMPLIDO | `LandingHero.tsx:22,28-32,35-36`; `globals.css:540-549` |
| 2. prefers-reduced-motion sigue forzando `opacity: 1` sin `is-ready` | ✔ CUMPLIDO | `globals.css:560-563` cubre `.landing-hero.is-ready .landing-hero-block` y `.landing-hero .landing-hero-block`; `LandingHero.tsx:29` (early-return) |
| 3. Bug 2: regla pública acepta `/[slug]` y `/[slug]/reservar` | ✔ CUMPLIDO | `middleware.ts:22-28`; runtime `curl` → 200 en `/barberia-el-clasico/reservar` |
| 4. Sin colisión con `RESERVED_ROOTS` (login/register/admin/barber/super-admin) | ✔ CUMPLIDO | `middleware.ts:13`; paths reservados no matchean por `segments[0]` |
| 5. Resto de reglas intactas (login/register con token, dashboards por rol, redirecciones) y matcher sin cambios | ✔ CUMPLIDO | `middleware.ts:30-63,74-76` |
| 6. Sin regresiones: tsc, lint y build pasan; ruta responde 200 (no 307) | ✔ CUMPLIDO | Auditor: `tsc` exit 0, `eslint` 0 errores, `npm run build` exit 0, `curl` 200/200 |
| 7. Restricciones: sin cambios en `.docs/`, `BookingWizard`, endpoints ni lógica de reservas | ✔ CUMPLIDO | `git status` — solo `LandingHero.tsx` + `middleware.ts` en esta iteración; `.docs` son del ciclo documental previo del Orquestador |
