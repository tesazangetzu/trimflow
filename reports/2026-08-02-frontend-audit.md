# Frontend — Auditoría de dependencias (`npm audit`)

**Fecha:** 2026-08-02
**Comando:** `cd frontend && npm audit --json` (+ `npm audit fix`)
**Alcance:** resolución de observaciones BAJA del sprint de testing del frontend.

## Estado inicial (antes del fix)

```
info: 0   low: 0   moderate: 0   high: 4   critical: 0   total: 4
```

| Paquete | Severity | Directa | Rango vulnerable | Descripción | Fix sin `--force` |
|---------|----------|---------|------------------|-------------|-------------------|
| `brace-expansion` | high | no | <1.1.17 | DoS vía expansión de longitud ilimitada (crash por OOM en minimatch) | **SÍ (aplicado)** |
| `next` | high | sí | 9.3.4-canary.0 – 16.3.0-preview.7 | depende de postcss y sharp vulnerables | Solo `--force` (next@9.3.3) |
| `postcss` | high | no | <=8.5.17 | XSS via `</style>`; file read via sourceMappingURL; path traversal de `.map` | Solo `--force` |
| `sharp` | high | no | <0.35.0 | libvips CVEs (CVE-2026-33327, -33328, -35590, -35591) | Solo `--force` |

## Pasos aplicados

### 1. `npm audit fix` (SIN `--force`)

Salida: `changed 1 package, audited 938 packages`. Resolvió `brace-expansion`:
- Antes: `brace-expansion@1.1.17` (vulnerable, <1.1.17).
- Después: `brace-expansion@1.1.18` / `5.0.8` (actualizado vía minimatch).

`next@9.3.3` **NO** se instaló (solo aparece como opción de `--force`, no aplicada).

### 2. Verificación final `npm audit --json`

| Info | Low | Moderate | High | Critical | Total |
|------|-----|----------|-------|----------|-------|
| 0    | 0   | 0        | **3** | 0        | **3** |

Vulnerabilidades restantes: `next`, `postcss`, `sharp` — todas bajo la misma cadena (de `next`), sin fix real disponible sin downgrade breaking a next@9.3.3.

## Estado de riesgo aceptado

Las 3 restantes quedan documentadas como **riesgo aceptado** en:

- `.docs/decisions/ADR-009-gestion-de-riesgo-dependencias-transitivas.md`

No se ejecutó `npm audit fix --force` (instalaría next@9.3.3, breaking change) ni se actualizó Next.js (el rango vulnerable incluye la última estable 16.2.12).