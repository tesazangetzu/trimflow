# ADR-009: Gestión de riesgo en dependencias transitivas (postcss y sharp vía next)

**Estado:** ACEPTADO (riesgo aceptado · revisar en cada `npm audit`)
**Fecha:** 2026-08-02

**Contexto:**
`npm audit` en el frontend reporta 4 vulnerabilidades high. Tras aplicar `npm audit fix` (sin `--force`), se resuelve `brace-expansion` (DoS por expansión de longitud ilimitada en `minimatch <1.1.17`). Quedan 3 vulnerabilidades high que no tienen una corrección directa disponible sin un cambio breaking en Next.js:

- **postcss 8.4.31** (dependencia transitiva de `node_modules/next/node_modules/postcss`): XSS via `</style>` sin escapar en el stringify de CSS (GHSA-qx2v-qp2m-jg93), lectura arbitraria de archivos e información vía `sourceMappingURL` controlada por atacante (GHSA-6g55-p6wh-862q) y path traversal en auto-loading de source maps conducen a divulgación arbitraria de archivos `.map` (GHSA-r28c-9q8g-f849).
- **sharp 0.34.5** (dependencia transitiva de `next`): vulnerabilidades heredadas en `libvips` (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591).

El único "fix" que ofrece `npm audit` es `npm audit fix --force`, que instalaría **next@9.3.3** (downgrade a una versión obsoleta = breaking change).

## Decisión

**NO aplicar `npm audit fix --force`** por las siguientes razones:

- Instalaría `next@9.3.3`, un downgrade masivo y breaking (pasaría de Next 16.2.12 a Next 9.3.3), incompatible con el resto del stack (React 19, App Router, Tailwind 4).
- El rango vulnerable de `next` (`9.3.4-canary.0` → `16.3.0-preview.7`) **incluye la última versión estable** (16.2.12). No existe una versión estable de `next` 16.x que resuelva las dependencias vulnerables, de modo que "actualizar Next" dentro de 16.x no resuelve el problema.
- **NO actualizar Next.js** a beta/preview de referencia para este cambio en un sprint de observaciones baja.
- El riesgo se considera **aceptado y documentado**, con re-auditoría en cada sprint.

## Consecuencias

### Riesgo residual
- **postcss** solo corre en la toolchain de build del frontend y no está expuesto a input de usuario en runtime. La explotación (XSS via stringify, file read via sourceMappingURL, path traversal de `.map`) requeriría que un atacante pudiera controlar el CSS o los source maps procesados durante el build, lo que no es posible en el flujo actual.
- **sharp** opera exclusivamente server-side (procesamiento de imágenes durante el build/render), no recibe input de usuario directamente y sus CVEs (libvips) requerirían manipular imágenes hostiles que luego se procesen con libvips.

### Mitigación adicional
- Auditar el uso de `next/image` (el pipeline de imágenes de Next despende de sharp) y, si se sirven imágenes subidas por usuarios, validarlas y/o procesarlas en un servicio aislado.
- Mantener/fortalecer una CSP para limitar el impacto de cualquier XSS residual.
- Confiar en que el sistema nunca expone `postcss` ni sus source maps a usuarios finales.

### Re-auditoria
- Ejecutar `npm audit` en cada sprint.
- Revisar la disponibilidad de `next` estable `> 16.3.0-preview.7` sin las dependencias vulnerables.

## Criterio de salida (cierre de la ADR)

Cuando `next` publique una versión estable `> 16.3.0-preview.7` que **no** dependa de `postcss` ni `sharp` vulnerables, aplicar `npm audit fix` y/o actualizar Next.js de forma segura, resolver las vulnerabilidades y **cerrar esta ADR**.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **`npm audit fix --force` → next@9.3.3** | Downgrade breaking, rompe todo el stack (React 19, App Router). Inaceptable. |
| **Actualizar Next.js 16.x** | El rango vulnerable incluye la última estable; no hay release 16.x seguro disponible. |
| **Pin de `sharp`/`postcss` a versiones corregidas** | Son dependencias internas de `next` (node_modules de next); alinear versiones rompería resolución de npm. |
| **Aceptado y documentado (decisión actual)** | Riesgo residual acotado a build server-side / toolchain; se mitiga con auditoría de imágenes y CSP. |

## Impacto en .docs

- `reports/2026-08-02-frontend-audit.md`: evidencia del estado de `npm audit` antes/después del fix seguro.
- `reports/2026-08-02_observaciones-baja_iter1.md`: reporte de ejecución de esta tarea.
- `changelog/2026.md`: entrada con fecha y referencia a esta ADR.