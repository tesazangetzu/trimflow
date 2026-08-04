# ADR-001: Monorepo vs Repos Separados

**Estado:** ACEPTADO
**Fecha:** 2026-07-28

**Contexto:**
Se debe decidir la estrategia de organización de repositorios para TrimFlow. El stack incluye un backend (NestJS + TypeORM + PostgreSQL + Redis + BullMQ) y un frontend (Next.js + React + Tailwind + shadcn/ui). La decisión afecta el flujo de trabajo del equipo, la integración continua, el despliegue y la consistencia del proyecto.

## Decisión

Se utilizarán **repositorios separados** para backend y frontend, cada uno con su propio repositorio Git. La estructura de carpetas dentro del workspace local será de **carpetas hermanas** al mismo nivel:

```
workspace/
├── backend/    # NestJS + TypeORM
└── frontend/   # Next.js + React
```

No se usará ninguna herramienta de monorepo (Nx, Turborepo, etc.). Cada proyecto es completamente independiente en su tooling, dependencias y pipeline de CI/CD.

## Consecuencias

### Positivas
- **Simplicidad:** cada repo tiene su propio `package.json`, config y build sin重叠
- **Independencia:** los equipos pueden evolucionar backend y frontend a ritmos distintos
- **Despliegues desacoplados:** cada proyecto se despliega sin afectar al otro
- **Tamaño reducido:** clones más rápidos, historias más enfocadas
- **Permisos granulares:** se pueden restringir accesos por repo

### Negativas
- **Tipos/DTOs duplicados:** las interfaces compartidas deben mantenerse sincronizadas manualmente o mediante un paquete compartido externo
- **Coordinación manual de cambios:** los PRs que tocan ambos lados requieren comunicación explícita entre repos
- **Versionado cruzado complejo:** saber qué versión de frontend es compatible con qué versión de backend requiere documentación o contrato API estable (OpenAPI)
- **Sin un solo comando de build/start para todo el sistema**

## Alternativa descartada

**Monorepo con Nx/Turborepo:** fue la principal alternativa evaluada. Ofrece código compartido (tipos, DTOs, interfaces), un solo comando para construir todo, historial unificado, dependencias consistentes y CI/CD simplificado. Se descartó porque la prioridad actual es la simplicidad y autonomía de cada capa; el costo de configurar y mantener un monorepo no se justifica para el tamaño actual del equipo.

## Pregunta al programador

¿Monorepo (Nx/Turborepo) o repos separados para backend y frontend?
