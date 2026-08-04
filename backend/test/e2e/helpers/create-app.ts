import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { stopTestContainers } from '../../testcontainers/connection';

/**
 * Levanta la app NestJS completa (igual a main.ts, con prefijo v1) sobre los
 * contenedores de test. El env (DATABASE_URL/REDIS_URL/JWT_* y
 * NODE_ENV=development) ya fue inyectado por setup-env.ts (setupFiles) antes de
 * importar AppModule, para que ConfigModule no lea `.env.development`.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication | undefined): Promise<void> {
  if (app) await app.close();
  await stopTestContainers();
}
