# Guards + Decorators Implementation — Iteration 5

**Date:** 2026-07-27

## Files Created

### Guards (3 files)
- `backend/src/shared/guards/jwt-auth.guard.ts` — Extends `AuthGuard('jwt')`, throws `UnauthorizedError` on invalid/expired token.
- `backend/src/shared/guards/roles.guard.ts` — Uses `Reflector` to check `roles` metadata, throws `ForbiddenError` if user lacks role or is unauthenticated.
- `backend/src/shared/guards/index.ts` — Barrel export.

### Decorators (4 files)
- `backend/src/shared/decorators/current-user.decorator.ts` — Extracts `request.user`, optionally by key.
- `backend/src/shared/decorators/roles.decorator.ts` — `@Roles(...)` sets `roles` metadata via `SetMetadata`.
- `backend/src/shared/decorators/tenant.decorator.ts` — Extracts `request.tenant`, optionally by key.
- `backend/src/shared/decorators/index.ts` — Barrel export.

## Verification
- `npm run build` — **PASS** (no errors)

## Dependencies
- Exception classes: `UnauthorizedError` (401), `ForbiddenError` (403)
- NestJS packages: `@nestjs/common`, `@nestjs/core`, `@nestjs/passport`, `passport`
