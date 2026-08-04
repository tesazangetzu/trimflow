import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { DataSource } from 'typeorm';

import { Tenant } from '../../src/modules/tenants/entities/tenant.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { Barber } from '../../src/modules/barbers/entities/barber.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { Service } from '../../src/modules/services/entities/service.entity';
import { Appointment } from '../../src/modules/appointments/entities/appointment.entity';
import { User } from '../../src/modules/auth/entities/user.entity';
import { Notification } from '../../src/modules/notifications/entities/notification.entity';
import { Schedule } from '../../src/modules/schedule/entities/schedule.entity';
import { AvailabilityBlock } from '../../src/modules/schedule/entities/availability-block.entity';
import { Setting } from '../../src/modules/settings/entities/setting.entity';

import { CreateAllTables1785210750237 } from '../../src/database/migrations/1785210750237-CreateAllTables';
import { AddUsersTable1785210911058 } from '../../src/database/migrations/1785210911058-AddUsersTable';
import { AddScheduleTables1785316874524 } from '../../src/database/migrations/1785316874524-AddScheduleTables';

let postgres: StartedPostgreSqlContainer | undefined;
let redis: StartedRedisContainer | undefined;
let dataSource: DataSource | undefined;

export const TEST_ENV = {
  NODE_ENV: 'development' as const,
  JWT_SECRET: 'test_jwt_secret_min_32_characters_long!',
  JWT_REFRESH_SECRET: 'test_refresh_secret_min_32_chars!',
};

function createDataSource(url: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url,
    entities: [
      Tenant,
      Branch,
      Barber,
      Customer,
      Service,
      Appointment,
      User,
      Notification,
      Schedule,
      AvailabilityBlock,
      Setting,
    ],
    migrations: [
      CreateAllTables1785210750237,
      AddUsersTable1785210911058,
      AddScheduleTables1785316874524,
    ],
    migrationsTableName: 'typeorm_migrations',
    logging: false,
  });
}

/**
 * Devuelve el DataSource de test. En el proceso de globalSetup arranca el
 * contenedor Postgres; en los workers de jest reutiliza la URL que globalSetup
 * escribió en `.testcontainers/test-env.json` (inyectada por setup-env.ts).
 * Las migraciones son idempotentes: runMigrations() solo ejecuta las pendientes.
 */
export async function getTestPostgres(): Promise<{ url: string; dataSource: DataSource }> {
  if (!dataSource) {
    if (process.env.DATABASE_URL && !postgres) {
      dataSource = createDataSource(process.env.DATABASE_URL);
      await dataSource.initialize();
      await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      await dataSource.runMigrations();
    } else {
      postgres = await new PostgreSqlContainer('postgres:18-alpine').start();
      const url = postgres.getConnectionUri();
      process.env.DATABASE_URL = url;
      process.env.NODE_ENV = TEST_ENV.NODE_ENV;
      process.env.JWT_SECRET = TEST_ENV.JWT_SECRET;
      process.env.JWT_REFRESH_SECRET = TEST_ENV.JWT_REFRESH_SECRET;

      dataSource = createDataSource(url);
      await dataSource.initialize();
      // Crítico: las migraciones usan uuid_generate_v4() de la extensión uuid-ossp
      await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      await dataSource.runMigrations();
    }
  }
  return { url: process.env.DATABASE_URL!, dataSource: dataSource! };
}

export async function getTestRedis(): Promise<{ url: string }> {
  if (process.env.REDIS_URL && !redis) {
    return { url: process.env.REDIS_URL };
  }
  if (!redis) {
    redis = await new RedisContainer('redis:7-alpine').start();
    process.env.REDIS_URL = redis.getConnectionUrl();
  }
  return { url: redis!.getConnectionUrl() };
}

export async function stopTestContainers(): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = undefined;
  }
  if (postgres) {
    await postgres.stop();
    postgres = undefined;
  }
  if (redis) {
    await redis.stop();
    redis = undefined;
  }
}
