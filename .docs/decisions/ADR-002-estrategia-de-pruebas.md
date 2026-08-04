# ADR-002: Estrategia de Pruebas

**Estado:** ACEPTADO
**Fecha:** 2026-07-27
**Contexto:**
Se necesita definir cómo se probará el sistema para garantizar calidad, prevenir regresiones y permitir refactoring seguro. La estrategia debe cubrir backend (NestJS) y frontend (Next.js/React), alineándose con la filosofía del proyecto: simple, rápida y confiable.

## Decisión

Se adoptará **Jest** como framework principal de pruebas (backtesting unitario, integración y e2e). Se usará **Testing Library** para pruebas de componentes React.

### Backend

| Tipo | Ubicación | Descripción |
|------|-----------|-------------|
| **Unitarias** | `src/<modulo>/__tests__/*.spec.ts` | Pruebas aisladas de servicios, validadores y utilidades. Mocks de dependencias externas. |
| **Integración** | `src/<modulo>/__tests__/*.integration.spec.ts` | Pruebas con base de datos real (SQLite en memoria o PostgreSQL vía Testcontainers). |
| **E2E** | `test/e2e/*.e2e-spec.ts` | Pruebas de extremo a extremo contra la API completa con base de datos de prueba. |

### Frontend

| Tipo | Ubicación | Descripción |
|------|-----------|-------------|
| **Unitarias** | `src/components/__tests__/*.test.tsx` | Pruebas de componentes individuales con Testing Library. |
| **Integración** | `src/__tests__/*.test.tsx` | Pruebas de páginas y flujos completos con MSW para mock de API. |
| **E2E** | `test/e2e/*.cy.ts` | Pruebas con Cypress o Playwright para flujos críticos (agendamiento, login). |

### Cobertura mínima

- **Líneas:** 80%
- **Ramas:** 75%
- **Funciones:** 85%
- **Archivos:** 90%

### Reglas

- Todo archivo nuevo en `src/` debe tener al menos una prueba unitaria.
- Los servicios core (Appointments, Tenant isolation) deben tener pruebas de integración.
- Los flujos críticos (creación de cita, autenticación) deben tener pruebas e2e.
- No se permite merge sin que pasen todas las pruebas.

## Consecuencias

### Positivas
- Detección temprana de regresiones.
- Documentación viva del comportamiento esperado.
- Refactoring seguro.
- Cultura de calidad desde el inicio.

### Negativas
- Tiempo adicional en desarrollo inicial.
- Mantenimiento de infraestructura de prueba (Testcontainers, bases de datos de prueba).

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Vitest** | Excelente, pero Jest es el framework estándar de NestJS y tiene mejor integración con su ecosistema de testing. |
| **Mocha + Chai** | Mayor flexibilidad pero menor integración con NestJS. Requiere más configuración manual. |
| **Solo pruebas e2e** | Las pruebas e2e son lentas y frágiles. No reemplazan pruebas unitarias y de integración. |

## Impacto en .docs

- Se debe actualizar si se cambia de framework de pruebas.
