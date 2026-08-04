# ADR-006: Migraciones de Base de Datos

**Estado:** ACEPTADO
**Fecha:** 2026-07-27
**Contexto:**
El proyecto usa TypeORM como ORM y PostgreSQL como base de datos. Se necesita un proceso definido para gestionar cambios en el esquema de base de datos de manera controlada, reproducible y segura en todos los entornos.

## Decisión

Se usarán las **migraciones nativas de TypeORM** con generación automática desde las entidades.

### Flujo de trabajo

1. **Modificar entidades** en `src/<modulo>/entities/`.
2. **Generar migración** automáticamente:
   ```bash
   npm run migration:generate -- src/database/migrations/MigrationName
   ```
3. **Revisar** la migración generada (TypeORM no siempre genera migraciones perfectas).
4. **Ejecutar en desarrollo**:
   ```bash
   npm run migration:run
   ```
5. **Commit** de la migración junto con los cambios de entidades.
6. **CI/CD ejecuta** `migration:run` antes de desplegar.

### Scripts de npm

```json
{
  "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts",
  "migration:create": "typeorm-ts-node-commonjs migration:create",
  "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
  "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts",
  "migration:show": "typeorm-ts-node-commonjs migration:show -d src/database/data-source.ts"
}
```

### Estructura de carpetas

```
src/
  database/
    data-source.ts            # DataSource config (lectura de .env)
    migrations/               # Migraciones generadas manual/automáticamente
      20260727000001-CreateTenantsTable.ts
      20260727000002-CreateBranchesTable.ts
      ...
    seeds/                    # Datos semilla para desarrollo
      admin-seed.ts
      demo-data.ts
```

### Convenciones de nombres

- Formato: `YYYYMMDDHHMMSS-NombreDescriptivo.ts`
- Ejemplo: `20260727000001-CreateTenantsTable.ts`
- Los nombres deben describir el cambio en PascalCase.

### DataSource separado

El archivo `data-source.ts` se configura aparte del módulo de aplicación para que TypeORM CLI pueda usarlo sin cargar toda la app de NestJS:

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
});
```

### Seeds (desarrollo)

Los seeds son archivos independientes para poblar datos de desarrollo:

```bash
npm run seed:run     # Ejecuta todos los seeds
npm run seed:revert  # Revierte el último seed
```

### Reglas

- Una migración por cambio atómico.
- Nunca editar una migración que ya fue commiteada a main.
- Para revertir, crear una nueva migración que deshaga el cambio.
- Las migraciones se ejecutan automáticamente en staging/producción como parte del despliegue (no en el inicio de la aplicación).

## Consecuencias

### Positivas
- Cambios de esquema controlados y versionados.
- Posibilidad de revertir migraciones.
- Historial completo de cambios en base de datos.
- Integración con CI/CD.

### Negativas
- Las migraciones generadas automáticamente por TypeORM a veces requieren ajustes manuales.
- Riesgo de conflictos si dos desarrolladores generan migraciones en paralelo.
- Las migraciones pueden ser lentas en tablas grandes.

## Alternativas consideradas

| Alternativa | Razón para descartar |
|-------------|---------------------|
| **Synchronize: true** | Solo para desarrollo. Peligroso para producción: pérdida de datos. |
| **Migraciones manuales** | Más control pero propenso a errores humanos y lento. |
| **Prisma Migrate** | Requiere cambiar de ORM. TypeORM fue decidido en PROJECT.md. |

## Impacto en .docs

- La documentación de despliegue debe incluir la ejecución de migraciones como paso obligatorio.
