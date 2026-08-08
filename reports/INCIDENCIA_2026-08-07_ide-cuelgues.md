# Reporte de Incidencia — Cuelgues y cierre del IDE

> **Fecha:** 2026-08-07 (sesión reiniciada ~19:33)
> **Proyecto:** trimflow
> **Síntoma:** El IDE se cuelga y se cierra. No es la primera vez que ocurre.
> **Registrado por:** Agente Orquestador

---

## Síntoma reportado

El programador reporta que el IDE se cuelga y se cierra, y que esto ha ocurrido en más de una ocasión. En esta sesión, el agente perdió el contexto de la conversación anterior (reinicio de sesión) y quedó trabajo sin commitear en el repositorio.

## Evidencia recopilada

### 1. Presión de memoria severa (causa principal)

```
Mem:           7.4Gi       3.9Gi       1.7Gi       5.1Mi       2.0Gi       3.5Gi
Swap:          2.0Gi       1.6Gi       428Mi
```

- **RAM total:** 7.4 GiB — máquina con poca memoria para la carga actual.
- **Swap casi lleno:** 1.6 GiB de 2.0 GiB usados (80%). Cuando el swap se llena y la RAM se agota, el sistema entra en *thrashing*: todo se congela y los procesos pueden morir o el IDE se cierra.
- **Load average:** 4.53 (1 min), 24.15 (5 min), 15.19 (15 min) — carga sostenida muy alta en una máquina de 16 cores.

### 2. Procesos que consumen más memoria (top)

| Proceso | RAM | % |
|---------|-----|---|
| `next-server` (dev, v16.2.12) | 1.2 GiB | 15.4% |
| `opencode` (CLI, sesión actual) | 820 MiB | 10.5% |
| VS Code extension host | 511 MiB | 6.5% |
| VS Code server-main | 278 MiB | 3.5% |
| Serena MCP (python) | 260 MiB | 3.3% |
| tailwindServer (VS Code ext) | 177 MiB | 2.2% |
| tsserver x2 (TypeScript LSP) | ~190 MiB | 2.4% |
| headroom MCP | 94 MiB | 1.2% |
| nest start --watch (backend) | 77 MiB | 0.9% |

**Suma solo de estos procesos: ~3.6 GiB**, más el sistema operativo y el resto de procesos. Con 7.4 GiB totales, el margen es mínimo y el swap se llena.

### 3. Base de datos de opencode muy grande

- `~/.local/share/opencode/opencode.db` pesa **195 MB** (crece con cada sesión).
- `opencode.db-wal` de 4.3 MB activo.
- El log `opencode.log` pesa 7.0 MB y crece sin rotación aparente.

Una base de datos de 195 MB puede ralentizar el arranque y las operaciones de opencode, contribuyendo a la sensación de cuelgue.

### 4. Patrón de la sesión actual

- El proceso `opencode` arrancó a las 19:33 con 54% CPU y 820 MiB RSS.
- El log muestra que la sesión anterior se perdió (nueva sesión `ses_021355...` creada a las 00:34 UTC = 19:34 local).
- El trabajo sin commitear (landing pública + reservas, ADR-012/013/014) quedó a medias.

---

## Diagnóstico

**Causa raíz probable: agotamiento de memoria RAM + swap saturado.**

La combinación de:
1. `next-server` en modo dev (1.2 GiB),
2. opencode + VS Code server + extensiones (≈1.6 GiB),
3. Serena + 2 tsserver + headroom (≈550 MiB),
4. backend Nest en watch (77 MiB),

supera la RAM disponible (7.4 GiB) y empuja al sistema a usar swap de forma intensiva. Cuando el swap se llena, el sistema entra en *thrashing*: el IDE deja de responder (cuelgue) y en casos extremos el proceso se cierra o el sistema mata procesos.

**Factores agravantes:**
- `opencode.db` de 195 MB (crecimiento sin limpieza).
- Múltiples servidores de lenguaje activos simultáneamente (2 tsserver + tailwind + serena).
- Backend Nest en modo `--watch` + frontend Next en modo dev corriendo a la vez.

---

## Recomendaciones

### Inmediatas (aliviar presión de memoria)
1. **Cerrar procesos que no se usen:** si no se está trabajando en el backend, detener `nest start --watch`; si no se usa el frontend, detener `next-server`.
2. **Reiniciar VS Code / opencode** cuando la memoria esté liberada.
3. **Cerrar pestañas/extensiones pesadas** de VS Code (tailwind server consume 177 MiB).

### A medio plazo
4. **Limpiar `opencode.db`**: el archivo de 195 MB acumula historial. Considerar purgar sesiones antiguas o archivar la base de datos.
5. **Reducir servidores LSP**: si Serena y el tsserver de VS Code duplican análisis, desactivar uno de ellos.
6. **Aumentar swap** (p. ej. a 4 GiB) como colchón, o **agregar RAM** si es posible.

### Preventivas
7. **Commitear con frecuencia** el trabajo en curso para no perder contexto si el IDE se cierra (como ocurrió con la landing pública).
8. Monitorear con `free -h` y `uptime` antes de sesiones largas.

---

## Acciones tomadas (2026-08-07 ~19:39)

1. **Detenido `next-server`** (dev, 1.2 GiB) — liberado con SIGKILL.
2. **`nest start --watch` NO pudo detenerse** — corre como root y requiere contraseña sudo. **Pendiente: detenerlo manualmente** (`sudo kill 911` o `sudo pkill -f "nest start"`).
3. **Commit del trabajo pendiente:** `ec78254 wip: landing pública con reservas (ADR-012/013/014) + reporte incidencia cuelgues IDE` (22 archivos, +1024/-215).
4. **Graphify actualizado** tras el commit (3276 nodos, 5676 edges).

### Resultado de la liberación de memoria

| Métrica | Antes | Después |
|---------|-------|---------|
| RAM usada | 3.9 GiB | 2.7 GiB |
| RAM disponible | 3.5 GiB | 4.7 GiB |
| Swap usado | 1.6 GiB (80%) | 626 MiB (30%) |
| Load 1 min | 4.53 | 0.88 |

---

## Estrategia de trabajo para reducir consumo de recursos

Ajustes acordados con el programador para evitar futuros cuelgues:

1. **Commits frecuentes:** commitear al final de cada unidad de trabajo completada (no esperar al final del ciclo completo).
2. **Dividir el trabajo en piezas pequeñas:** cada iteración del ciclo debe apuntar a un objetivo acotado (una feature, un módulo, un fix), no a múltiples frentes simultáneos.
3. **No levantar servicios innecesarios:** backend (`nest start --watch`) y frontend (`next-server`) solo cuando se necesiten para verificar; detenerlos al terminar.
4. **Evitar exploraciones masivas:** usar Graphify/Serena para consultas dirigidas en lugar de lecturas completas de archivos (reduce contexto y memoria).
5. **Monitorear antes de sesiones largas:** `free -h` y `uptime` al inicio; si el swap supera el 50%, detener servicios antes de continuar.

---

## Estado del trabajo al momento del cierre

- **Último commit:** `d54f91e docs: reporte técnico final del ciclo commit ADR-013 + tests break`
- **Sin commitear:** ADR-012/013 modificados, ADR-014 nuevo, `landing-config.ts`, página admin landing, página `[slug]`, componentes landing (Hero, Page, Sections, theme), `types/landing.ts`, página `[slug]/reservar/`, `ReservationPage.tsx`, `LandingCTA/Nav/State/Reveal`, `hooks/landing/`.

---

*Registrado por el Agente Orquestador. Este reporte no sustituye un diagnóstico de sistema; es un registro de la incidencia con la evidencia disponible.*