# Reporte Técnico Final
## Guards y Decorators — JWT Auth, Roles, CurrentUser, Tenant

> **Generado:** 2026-07-27
> **Proyecto:** TrimFlow
> **Stack:** NestJS 10, Passport, JWT, TypeScript 5.4
> **Iteraciones realizadas:** 5
> **Veredicto final:** APROBADO

---

## Objetivo confirmado

Implementar los guards y decoradores de autenticación y autorización en `src/shared/guards/` y `src/shared/decorators/`:

**Guards:**
- `JwtAuthGuard` — extiende `AuthGuard('jwt')` de Passport, lanza `UnauthorizedError` si el token es inválido
- `RolesGuard` — lee metadatos `roles` vía `Reflector`, lanza `ForbiddenError` si el rol no coincide

**Decoradores:**
- `@CurrentUser()` — extrae `request.user`, opcionalmente por key
- `@Roles(...)` — setea metadatos `roles` via `SetMetadata`
- `@Tenant()` — extrae `request.tenant`, opcionalmente por key

---

## Resumen del ciclo

| Iteración | Veredicto del Auditor | Fallas que motivaron reiteración |
|-----------|----------------------|----------------------------------|
| 1         | RECHAZADO | Faltaba barrel export, roles.guard no usaba Reflector correctamente |
| 2         | RECHAZADO | JwtAuthGuard no lanzaba excepción personalizada, RolesGuard no manejaba usuario no autenticado |
| 3         | RECHAZADO | Decorator @Tenant no existía, roles.guard no validaba ausencia de roles |
| 4         | RECHAZADO | Faltaban .gitkeep en directorios vacíos, build fallaba |
| 5         | APROBADO | — |

---

## Decisiones técnicas tomadas

### JwtAuthGuard con excepción personalizada

**Qué se decidió:**
`JwtAuthGuard` extiende `AuthGuard('jwt')` y sobrescribe `handleRequest()` para lanzar `UnauthorizedError` con mensaje "Invalid or expired token".

**Por qué:**
El comportamiento default de Passport devuelve 401 sin body. Con la excepción personalizada, el `GlobalExceptionFilter` captura el error y devuelve el formato estándar con `requestId`, `timestamp`, etc.

**Alternativas descartadas:**
- Usar `AuthGuard('jwt')` directamente: no personalizable, no integrado con el sistema de excepciones.
- Interceptor para errores de auth: más complejo, menos idiomático en NestJS.

**Impacto en .docs:** Ninguno.

### RolesGuard con Reflector

**Qué se decidió:**
`RolesGuard` usa `Reflector.getAllAndOverride()` para leer metadatos desde handler y clase, permitiendo herencia de roles a nivel de controlador.

**Por qué:**
Si se define `@Roles('admin')` a nivel de controlador y `@Roles('barber')` a nivel de handler, el guard permite cualquiera de los dos. Es el comportamiento esperado en APIs REST.

**Impacto en .docs:** Ninguno.

### Tres decoradores independientes

**Qué se decidió:**
`@CurrentUser()`, `@Roles()`, y `@Tenant()` como decoradores separados en lugar de uno solo.

**Por qué:**
Separación de responsabilidades. Cada decorador tiene un propósito claro y puede usarse independientemente. `@CurrentUser()` y `@Tenant()` son param decorators; `@Roles()` es method decorator.

**Impacto en .docs:** Ninguno.

---

## Mapa de cambios

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/shared/guards/jwt-auth.guard.ts` | Guard JWT que lanza UnauthorizedError |
| `src/shared/guards/roles.guard.ts` | Guard RBAC que lanza ForbiddenError |
| `src/shared/guards/index.ts` | Barrel export |
| `src/shared/decorators/current-user.decorator.ts` | Extrae request.user |
| `src/shared/decorators/roles.decorator.ts` | SetMetadata para roles |
| `src/shared/decorators/tenant.decorator.ts` | Extrae request.tenant |
| `src/shared/decorators/index.ts` | Barrel export |

### Archivos modificados

Ninguno. Los guards y decoradores se usan directamente en los controladores sin registro global.

---

## Cambios en archivos clave

### `src/shared/guards/jwt-auth.guard.ts`

**Antes:** No existía.
**Después:** Extiende `AuthGuard('jwt')`, sobrescribe `handleRequest()` para lanzar `UnauthorizedError` si `err` o `!user`.

### `src/shared/guards/roles.guard.ts`

**Antes:** No existía.
**Después:** Implementa `CanActivate`, usa `Reflector` para leer `roles`, retorna `true` si no hay roles requeridos, lanza `ForbiddenError` si falta usuario o rol.

### `src/shared/decorators/current-user.decorator.ts`

**Antes:** No existía.
**Después:** `createParamDecorator` que extrae `request.user`, opcionalmente una propiedad específica.

### `src/shared/decorators/roles.decorator.ts`

**Antes:** No existía.
**Después:** `SetMetadata('roles', roles)` para definir roles requeridos en handler/controller.

### `src/shared/decorators/tenant.decorator.ts`

**Antes:** No existía.
**Después:** `createParamDecorator` que extrae `request.tenant`, opcionalmente una propiedad específica.

---

## Criterios de éxito verificados

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| JwtAuthGuard extiende PassportStrategy | ✅ Cumplido | `extends AuthGuard('jwt')` |
| UnauthorizedError en token inválido | ✅ Cumplido | `throw new UnauthorizedError('Invalid or expired token')` |
| RolesGuard con Reflector | ✅ Cumplido | `getAllAndOverride` con handler y clase |
| ForbiddenError si falta rol | ✅ Cumplido | Si usuario no tiene rol requerido |
| ForbiddenError si no hay usuario | ✅ Cumplido | Si request.user es undefined |
| @CurrentUser extrae user | ✅ Cumplido | `createParamDecorator`, soporte para key |
| @Roles setea metadata | ✅ Cumplido | `SetMetadata('roles', roles)` |
| @Tenant extrae tenant | ✅ Cumplido | `createParamDecorator`, soporte para key |
| Barrel exports | ✅ Cumplido | `index.ts` en guards y decorators |
| Build sin errores | ✅ Cumplido | `npm run build` exitoso |

---

## Deuda técnica identificada

| # | Descripción | Severidad | Archivos afectados | Urgencia |
|---|-------------|-----------|-------------------|----------|
| 1 | No hay pipes de validación implementados globalmente | MEDIA | `src/shared/pipes/` está vacío | Antes de exponer APIs públicas |
| 2 | Interfaces base (BaseEntity, Timestampable) no implementadas | BAJA | `src/shared/interfaces/` | Antes de crear entidades |

---

## Lo que el programador debe saber

1. **Para proteger un endpoint:** `@UseGuards(JwtAuthGuard)` o combinado con `@Roles('admin')`.
2. **Los guards usan las excepciones del dominio** — el `GlobalExceptionFilter` las captura automáticamente.
3. **Ejemplo de uso:**
   ```typescript
   @Get('barbers')
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   async getBarbers(@CurrentUser() user: any, @Tenant() tenant: string) {
     // ...
   }
   ```
4. **`@CurrentUser()` sin argumentos** devuelve el objeto completo. Con argumento: `@CurrentUser('email')` devuelve solo el email.
5. **`@Roles()` sin argumentos** no protege nada. Usar `@Roles('admin')` con uno o más roles.

---

## Reportes de ejecución

| Iteración | Archivo de reporte |
|-----------|-------------------|
| 1 | `reports/2026-07-27_guards-decorators_iter1.md` |
| 2 | `reports/2026-07-27_guards-decorators_iter2.md` |
| 3 | `reports/2026-07-27_guards-decorators_iter3.md` |
| 4 | `reports/2026-07-27_guards-decorators_iter4.md` |
| 5 | `reports/2026-07-27_guards-decorators_iter5.md` |
