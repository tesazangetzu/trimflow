# Estrategia de Pruebas

## Framework

| Capa | Framework | Configuración |
|------|-----------|---------------|
| Backend (NestJS) | Jest | `jest.config.ts` con `@swc/jest` para transformación rápida |
| Frontend (Next.js/React) | Jest + Testing Library | `jest.config.ts` con `jest-environment-jsdom` |
| E2E | Jest (backend nativo) / Cypress o Playwright (frontend) | `test/e2e/` |

Consulte `ADR-002` para la justificación de esta decisión.

## Tipos de pruebas

### Pruebas unitarias

```typescript
// src/modules/appointments/services/appointment.service.spec.ts
describe('AppointmentService', () => {
  let service: AppointmentService;
  let repository: MockType<Repository<Appointment>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: getRepositoryToken(Appointment), useClass: RepositoryMock },
        { provide: BullQueue, useValue: queueMock },
      ],
    }).compile();
    service = module.get(AppointmentService);
  });

  it('should create an appointment', async () => { /* ... */ });
  it('should reject double booking', async () => { /* ... */ });
});
```

- Ubicación: `src/<modulo>/__tests__/*.spec.ts`
- Objetivo: probar UNA unidad de código de forma aislada.
- Mocks de repositorios, colas, servicios externos.

### Pruebas de integración

```typescript
// src/modules/appointments/__tests__/appointment.integration.spec.ts
describe('AppointmentService (Integration)', () => {
  beforeAll(async () => {
    // Usar Testcontainers o SQLite para base de datos real
  });

  it('should persist appointment and return it', async () => { /* ... */ });
  it('should enforce tenant isolation at DB level', async () => { /* ... */ });
});
```

- Ubicación: `src/<modulo>/__tests__/*.integration.spec.ts`
- Objetivo: probar interacción con infraestructura real (DB, Redis).
- Usar Testcontainers para PostgreSQL real o SQLite en memoria.

### Pruebas e2e (backend)

```typescript
// test/e2e/appointments.e2e-spec.ts
describe('Appointments (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp(); // App completa con DB de prueba
  });

  it('POST /v1/appointments should create appointment', async () => { /* ... */ });
  it('POST /v1/appointments should reject double booking', async () => { /* ... */ });
});
```

- Ubicación: `test/e2e/*.e2e-spec.ts`
- Objetivo: probar flujos completos HTTP → servicio → DB → respuesta.
- La app de NestJS se levanta completa con base de datos de prueba.

## Cobertura mínima

| Tipo | Líneas | Ramas | Funciones |
|------|--------|-------|-----------|
| Global | 80% | 75% | 85% |
| Módulo Appointments | 90% | 85% | 95% |
| Módulo Auth | 90% | 85% | 95% |

## Scripts de npm

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:integration": "jest --config jest.integration.config.ts",
  "test:e2e": "jest --config jest.e2e.config.ts --forceExit"
}
```

## Estructura de archivos de configuración

```
jest.config.ts              # Configuración base
jest.integration.config.ts  # Extiende base + timeout mayor + setup DB
jest.e2e.config.ts          # Extiende base + setup app completa
```

## Reglas de testing

1. **No mocks innecesarios**: Si el test se vuelve frágil por muchos mocks, reconsiderar el diseño.
2. **Pruebas descriptivas**: El nombre del test debe describir comportamiento, no implementación.
3. **Arrange → Act → Assert**: Estructura explícita en cada test.
4. **Un `it` por comportamiento**: Si necesitas "and" en el nombre, separa en dos tests.
5. **Los tests son documentación viva**: Deben reflejar el comportamiento esperado del sistema.
