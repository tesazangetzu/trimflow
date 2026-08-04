# Migraciones de Base de Datos

Consulte `ADR-006` para la justificación de las decisiones técnicas.

## Stack

| Elemento | Tecnología |
|----------|-----------|
| ORM | TypeORM |
| Motor | PostgreSQL 16 |
| Migraciones | TypeORM Migrations CLI |
| Seeds | Scripts TypeScript independientes |

## Flujo de trabajo

### 1. Desarrollo local

```bash
# 1. Modificar entidades (src/<modulo>/entities/*.entity.ts)
# 2. Generar migración automáticamente
npm run migration:generate -- src/database/migrations/AddServiceDuration

# 3. REVISAR la migración generada (¡obligatorio!)
# TypeORM a veces omite cambios o genera SQL subóptimo

# 4. Ejecutar migración
npm run migration:run

# 5. Verificar estado
npm run migration:show
```

### 2. Antes del commit

```bash
# Ejecutar todas las migraciones pendientes
npm run migration:run

# Revertir si hay problemas
npm run migration:revert

# Commitea: entidades + migración + (opcional) seed
```

### 3. CI/CD

```bash
# Paso pre-deploy obligatorio
npm run migration:run
```

## Estructura de migraciones

```
src/database/
├── data-source.ts                  # Configuración del DataSource
├── migrations/
│   ├── 20260727000001-CreateTenantsTable.ts
│   ├── 20260727000002-CreateBranchesTable.ts
│   ├── 20260727000003-AddServiceDuration.ts
│   └── ...
└── seeds/
    ├── admin-seed.ts
    └── demo-data.ts
```

### Convención de nombres

```
YYYYMMDDHHMMSS-DescripcionPascalCase.ts
```

Ejemplos:
- `20260727000001-CreateTenantsTable.ts`
- `20260727000002-CreateBranchesTable.ts`
- `20260727000003-AddServiceDuration.ts`

## Scripts de npm

```json
{
  "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts",
  "migration:create": "typeorm-ts-node-commonjs migration:create",
  "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
  "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts",
  "migration:show": "typeorm-ts-node-commonjs migration:show -d src/database/data-source.ts",
  "seed:run": "ts-node src/database/seeds/run.ts",
  "seed:revert": "ts-node src/database/seeds/revert.ts"
}
```

## Configuración del DataSource

El DataSource se configura en `src/database/data-source.ts`, separado del módulo de NestJS para que la CLI de TypeORM pueda usarlo sin cargar la aplicación completa:

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
```

## Reglas importantes

1. **Una migración por cambio atómico**: No mezclar cambios no relacionados.
2. **Nunca editar migraciones commiteadas**: Crear una nueva migración para revertir o modificar.
3. **Siempre revisar migraciones generadas**: TypeORM puede generar SQL incorrecto o ineficiente.
4. **`synchronize: false` en producción**: Usar solo migraciones explícitas.
5. **Las migraciones corren en CI/CD pre-deploy**: No al iniciar la aplicación.
6. **Prueba local antes del commit**: `migration:run` + `migration:revert` para verificar.
7. **Los seeds no se ejecutan en producción**: Solo desarrollo y staging.

## Estrategia de multi-tenant

Para el aislamiento multi-tenant, se usará una de las siguientes estrategias (pendiente de ADR específico):

- **Schema por tenant**: Cada tenant tiene su propio schema de PostgreSQL (`tenant_1`, `tenant_2`, etc.). Las migraciones se ejecutan N veces.
- **Columna tenant_id**: Tablas compartidas con columna `tenant_id` en cada entidad.

*(Decisión documentada en ADR futuro)*
