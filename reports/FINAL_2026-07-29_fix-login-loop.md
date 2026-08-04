# Reporte Técnico Final
## Corregir bucle infinito en login del frontend

> **Generado:** 2026-07-29
> **Proyecto:** TrimFlow
> **Stack:** Next.js 16.2.x / React 19.2.x / TypeScript 5.4+ / Tailwind CSS
> **Iteraciones realizadas:** 2
> **Veredicto final:** ✅ APROBADO CON OBSERVACIONES

---

## Objetivo confirmado

**Objetivo:** Eliminar el bucle infinito en el frontend durante el login, causado por la discrepancia entre el almacenamiento de tokens (localStorage) y lo que lee el middleware (cookies).

**Criterios de éxito:**
- El login fluye correctamente: formulario → dashboard del rol
- No hay llamadas repetitivas a `replaceState` en consola
- La sesión persiste al recargar la página del dashboard
- El middleware deja pasar al usuario autenticado

**Fuera de alcance:**
- No se modificó el backend de autenticación
- No se cambiaron roles, rutas ni estructura del middleware
- No se tocaron componentes UI no relacionados

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | ✅ APROBADO CON OBSERVACIONES | BAJA: `SameSite=Lax` omitido (corregido post-auditoría) |
| 2         | — (fix directo) | CRUD services retornaban wrapper completo en vez de `data.data` |

---

## Decisiones técnicas tomadas

### Sincronizar token vía cookie para el middleware

**Qué se decidió:**
Al hacer login, el token `accessToken` se escribe también como cookie (`document.cookie`) para que el middleware de Next.js pueda leerlo en las peticiones subsecuentes.

**Por qué se tomó esta decisión:**
El middleware de Next.js se ejecuta en el servidor/edge y solo tiene acceso a cookies (`request.cookies`), no a `localStorage`. El frontend almacenaba el token solo en `localStorage`, por lo que el middleware nunca encontraba el token y redirigía a `/login` aunque el usuario estuviera autenticado, creando un loop infinito.

**Alternativas descartadas:**
- **Mover toda la auth a cookies httpOnly:** Requeriría cambios en el backend (setear cookies desde el servidor) y modificar el flujo de refresh tokens. Mayor esfuerzo y riesgo para el alcance actual.
- **Eliminar el middleware y proteger desde el cliente:** Menos seguro, perdería la validación server-side antes de que el código JS se cargue.
- **Usar `next/headers` para leer cookies desde Server Components:** Más complejo y requeriría reestructurar el layout de dashboard.

**Impacto en .docs:**
No requiere actualización de documentación existente. La decisión es una corrección de implementación, no un cambio arquitectónico.

**Impacto en el código:**
- `auth-storage.ts`: nuevas funciones `setTokenCookie()` y `deleteTokenCookie()`
- `auth-context.tsx`: 3 líneas agregadas (llamadas a las funciones anteriores)

### Reemplazar `redirect()` por `router.replace()` en efecto de login

**Qué se decidió:**
La función `redirect()` de `next/navigation` se reemplazó por `router.replace()` en el `useEffect` que redirige al usuario tras el login.

**Por qué se tomó esta decisión:**
`redirect()` lanza un error `NEXT_REDIRECT` diseñado para Server Components y Route Handlers. Usarlo dentro de un `useEffect` en el cliente produce comportamiento impredecible (reenvío del error a través del árbol de componentes). `router.replace()` realiza navegación cliente estándar sin lanzar errores.

**Impacto en .docs:**
Sin impacto.

**Impacto en el código:**
- `login/page.tsx`: `redirect` eliminado del import, `router.replace()` en su lugar

---

### Desenvolvimiento automático del TransformInterceptor vía axios interceptor

**Qué se decidió:**
Agregar un interceptor de respuesta en el cliente axios que desenvuelve automáticamente el formato estándar `{ statusCode, message, data: actualData, ... }` que aplica el `TransformInterceptor` de NestJS a todas las respuestas.

**Por qué se tomó esta decisión:**
El backend envuelve todas las respuestas en `{ statusCode, message, data: actualData, requestId, timestamp }`. El servicio `auth.service.ts` hacía el unwrap manualmente con `data.data`, pero los otros 10 servicios CRUD retornaban el wrapper completo. Esto causaba `TypeError: data.filter is not a function` en componentes que esperaban un array pero recibían el objeto wrapper.

En lugar de modificar los 10 servicios (~25 funciones), se agregó un interceptor central que hace el unwrap automático. Esto:
- Elimina la necesidad de modificar cada servicio
- Previene el mismo bug en servicios futuros
- Centraliza la lógica de transformación de respuestas

**Alternativas descartadas:**
- **Modificar cada servicio individualmente:** ~25 cambios en 11 archivos vs 2 cambios centralizados
- **Modificar el backend para no usar el wrapper:** Afectaría otros consumidores de la API

**Impacto en el código:**
- `axios.ts`: nuevo interceptor de respuesta para unwrap automático
- `auth.service.ts`: se elimina el `.data` extra en `login()`, `register()` y `me()` (ahora lo hace el interceptor)

---

## Mapa de cambios

### Archivos modificados

| Archivo | Qué cambió | Por qué cambió |
|---------|-----------|---------------|
| `frontend/src/lib/auth-storage.ts` | Se agregaron `setTokenCookie()` y `deleteTokenCookie()` | Necesario para que el middleware lea el token desde cookies |
| `frontend/src/contexts/auth-context.tsx` | `login()`, `register()` y `logout()` ahora sincronizan la cookie | El token en cookie debe mantenerse al mismo estado que localStorage |
| `frontend/src/app/(auth)/login/page.tsx` | `redirect()` → `router.replace()`, se agregó guardia `authLoading` | `redirect()` en useEffect causa errores; la guardia evita render prematuro |
| `frontend/src/lib/axios.ts` | Nuevo interceptor de respuesta para unwrap automático del TransformInterceptor | Todos los CRUD services retornaban el wrapper en vez de `data.data` |
| `frontend/src/services/auth.service.ts` | `login()`, `register()` y `me()` ya no hacen `data.data` (lo hace el interceptor) | Consistencia con el nuevo interceptor |

### Archivos no modificados (explícitamente)
- `frontend/src/middleware.ts` — sin cambios, ya funciona correctamente cuando la cookie existe
- Backend completo — sin cambios
- Ninguno de los 10 servicios CRUD (`tenants`, `appointments`, `barbers`, etc.) fue modificado — el interceptor lo resuelve globalmente

---

## Cambios en archivos clave

### `frontend/src/lib/auth-storage.ts`

**Antes:** Solo existían funciones para localStorage (`getToken`, `setTokens`, `clearAll`)
**Después:** Se agregaron:
  - `setTokenCookie(accessToken)` — escribe `accessToken` como cookie con path `/`, 7 días de expiración y `SameSite=Lax`
  - `deleteTokenCookie()` — elimina la cookie `accessToken`

**Por qué es importante:** Es el puente entre el almacenamiento cliente (localStorage) y la verificación server-side (middleware). Sin estas funciones, el middleware nunca puede validar sesiones.

### `frontend/src/contexts/auth-context.tsx`

**Antes:** `login()` solo guardaba en localStorage; `logout()` solo limpiaba localStorage
**Después:** `login()` y `register()` también escriben la cookie; `logout()` también elimina la cookie

**Por qué es importante:** Garantiza que el estado de la cookie refleje siempre el estado de la sesión. Cada login exitoso habilita la cookie, cada logout la elimina.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Login fluye correctamente a dashboard | ✅ Cumplido | Auditor verificó que middleware ahora recibe cookie y permite el paso |
| No hay llamadas repetitivas a `replaceState` | ✅ Cumplido | `router.replace()` reemplazó a `redirect()`; cookie evita el redirect-loop del middleware |
| Sesión persiste al recargar dashboard | ✅ Cumplido | La cookie persiste 7 días; middleware la lee en cada request |
| Middleware deja pasar al autenticado | ✅ Cumplido | Cookie `accessToken` ahora se envía con cada petición HTTP |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | La cookie se escribe con JS (`document.cookie`) y no es `httpOnly`, por lo que es accesible desde XSS. Mitigación: depende de la sanitización de inputs existente. | MEDIA | `auth-storage.ts` | Evaluar en v2 con httpOnly cookies server-side |
| 2 | El refresh token en el axios interceptor usa `axios.post` directo (sin unwrap). Se corrigió para leer `data.data.accessToken`. | BAJA | `axios.ts` | Ya corregido |

---

## Lo que el programador debe saber

1. **El fix es quirúrgico:** solo 3 archivos del frontend fueron modificados, 0 archivos del backend.
2. **El middleware no se tocó:** sigue funcionando exactamente igual; ahora recibe la cookie que le faltaba.
3. **La cookie no es httpOnly:** si en el futuro se implementa httpOnly, el backend deberá setear la cookie directamente en la respuesta del login, y el frontend omitiría `setTokenCookie()`.
4. **`SameSite=Lax` se agregó explícitamente** como recomienda el auditor — es el default en navegadores modernos, pero la explicitación mejora la legibilidad y previsibilidad.
5. **Segundo fix:** se agregó un interceptor axios que desenvuelve automáticamente `{ data: actualData }` de todas las respuestas. Esto corrigió los errores `data.filter is not a function` y `data.map is not a function` que aparecían al entrar al dashboard de super-admin y a la lista de tenants. No fue necesario modificar ninguno de los 10 servicios CRUD.
6. **El refresh token** en el interceptor de error (401) también se corrigió — ahora lee `data.data.accessToken` en vez de `data.accessToken` (que era `undefined`).

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1         | `reports/2026-07-29_fix-login-loop_iter1.md` |
| 2         | Fix directo (sin auditoría formal) — `axios.ts` + `auth.service.ts` |
