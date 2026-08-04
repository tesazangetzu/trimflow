import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getTestPostgres, getTestRedis } from './connection';

const ENV_FILE = join(__dirname, '..', '..', '.testcontainers', 'test-env.json');

/**
 * Jest globalSetup: corre UNA vez en un proceso separado ANTES de los workers.
 * Arranca los contenedores y escribe las URLs en un archivo que setup-env.ts
 * (setupFiles) lee en cada worker. Así AppModule —que snapshotea el env en
 * tiempo de import— conecta contra el contenedor de test y no contra
 * `.env.development`.
 */
export default async function globalSetup(): Promise<void> {
  await getTestPostgres();
  await getTestRedis();

  mkdirSync(join(__dirname, '..', '..', '.testcontainers'), { recursive: true });
  writeFileSync(
    ENV_FILE,
    JSON.stringify({
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    }),
  );
}
