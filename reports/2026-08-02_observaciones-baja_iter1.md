# Reporte de ejecución — Observaciones BAJA (Sprint de testing frontend) · Iter 1

**Fecha:** 2026-08-02
**Trigger:** ORCHESTRATOR · Modo AUTO
**Objetivo:** Atender observaciones BAJA: (1) exclusión de `coverage/` de VCS, (2) resolución/documentación de vulnerabilidades `npm audit` del frontend.

---

## Resumen

- **BAJA-2 (coverage en VCS):** La regla `/coverage` **ya existía** en `frontend/.gitignore` (línea 14). Verificación git no ejecutable porque el repositorio **no tiene git inicializado** (ver Desviaciones). La observación se considera ya satisfecha a nivel de configuración; no hay archivos trackeados ni repo que los contenga.
- **BAJA-3 (npm audit, 4 high):** se aplicó `npm audit fix` (SIN `--force`) resolviendo **brace-expansion** (1 de 4). Las 3 restantes (`postcss`, `sharp` — transitivas de `next`) quedaron documentadas como **riesgo aceptado** en el ADR-009.
- `test`, `lint` y `build` siguen pasando (34 tests, 0 errores).

---

## Pasos ejecutados y salidas relevantes

### Fase 0 — Estado actual

- `frontend/.gitignore` contiene `/coverage` (línea 14). ✓
- `git check-ignore coverage/` y `git ls-files frontend/coverage/` → **fatal: not a git repository**. No hay .git en el workspace (root ni hermanos). No procede `git rm --cached` (no hay repo/tracked files).
- `npm audit --json` inicial: **4 high (total 4; 0 moderate/low/info/critical)**:
  - `brace-expansion` <1.1.17 — fix disponible (sin `--force`). **SÍ**
  - `next` `9.3.4-canary.0` → `16.3.0-preview.7` — fix solo `--force` → next@9.3.3.
  - `postcss` <=8.5.17 — fix solo `--force`.
  - `sharp` <0.35.0 — fix solo `--force`.
- Scripts verificados en `package.json`: `test`("jest"), `lint`("eslint"), `build`("next build"). ✓

### Fase 1 — Fix seguro

- `npm audit fix` → `changed 1 package, audited 938 packages`.
  - `brace-expansion@1.1.17` → `1.1.18`/`5.0.8` (vía minimatch). Resuelto.
- Regla dura cumplida: **no `--force`, no actualización de Next.js** (sigue `next@16.2.12`).

### Fase 2 — Documentación

- **Creado** `.docs/decisions/ADR-009-gestion-de-riesgo-dependencias-transitivas.md` (Estado: ACEPTADO · riesgo aceptado · re-auditar cada sprint; decisión, consecuencias, criterio de salida >16.3.0-preview.7, alternativas descartadas). Formato alineado con ADR-002/005/007.
- **Creado** `reports/2026-08-02-frontend-audit.md`: evidencia de diff + estado final (3 high).
- **Editado** `.docs/changelog/2026.md`: entrada `[2026-08-02] — Riesgo aceptado de dependencias transitivas (postcss + next) / ADR-009`.

### Fase 3 — Verificación final

| Comando | Resultado |
|---|---|
| `npm run test -- --ci` | 7 suites, 34 tests, 0 failures ✓ |
| `npm run lint` | eslint sin salida (0 errores) ✓ |
| `npm run build` | Build completo, 16 rutas, exit 0 ✓ |
| `npm audit --json` | **high=3** (`next`, `postcss`, `sharp`) · `brace-expansion` NO listado ✓ |
| `git status` / `git check-ignore` | No ejecutable (sin repo) — ver abajo |

---

## Archivos creados / modificados

| Archivo | Acción |
|---|---|
| `.docs/decisions/ADR-009-gestion-de-riesgo-dependencias-transitivas.md` | CREADO |
| `reports/2026-08-02-frontend-audit.md` | CREADO |
| `reports/2026-08-02_observaciones-baja_iter1.md` | CREADO (este reporte) |
| `.docs/changelog/2026.md` | MODIFICADO (entrada 2026-08-02) |
| `frontend/package-lock.json` | MODIFICADO (por `npm audit fix`) |

No se modificó `frontend/package.json` (ni sus dependencias directas) ni ningún `src/`.

---

## Desviaciones del plan

1. **No hay repositorio git inicializado** en el workspace (rootni hermanos: `find -maxdepth 3 -name .git` vacío). Consecuencia:
   - `git check-ignore` / `git ls-files` / `git status` no pudieron ejecutarse.
   - No se pudo "verificar" la exclusión vía git en runtime, pero la regla `/coverage` existe correctamente en `.gitignore`. Si se inicializa git en el futuro, `/coverage` (y `/./.next`, `/out`, `*.tsbuildinfo`) ya estarán ignorados.
   - No se ejecutó `git rm --cached` (no hay archivos trackeados ni repo).
2. La observación BAJA-2 estaba desactualizada: el repo YA cumplía la exclusión de `coverage/`. Confirmado a nivel de configuración.
3. Sin otra desviación: `--force` no se aplicó, Next.js no se actualizó, umbral de `functions` no se tocó, backend sin cambios.

---

## Estado de criterios de éxito

| Criterio | Estado |
|---|---|
| `coverage/` excluido de VCS | **CUMPLE** (regla `/coverage` en `.gitignore`; sin repo no hay archivos trackeados) |
| `npm audit fix` sin `--force` resuelve `brace-expansion` (1/4) | **CUMPLE** (1.1.17 → 1.1.18; ya no listado) |
| 3 restantes (postcss, sharp) documentadas como riesgo aceptado en ADR | **CUMPLE** (ADR-009) |
| `test`, `lint`, `build` siguen pasando | **CUMPLE** (34 tests / lint 0 / build exit 0) |

Nota: el criterio "git status: `coverage/` no aparece; solo package-lock.json y .docs cambian" no es verificable por ausencia de repo git; a nivel de configuración, `coverage/` está correctamente ignorado.