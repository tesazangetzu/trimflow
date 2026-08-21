import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TrimflowLoggerService } from './shared/logger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { runSeed } from './database/seeds/demo-seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = await app.resolve(TrimflowLoggerService);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'v1');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');

  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix);

  // Ruta raíz para health checks (Render/monitores hacen HEAD /).
  // Registrada a nivel Express para que viva fuera del prefijo global.
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.get('/', (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
    res.status(200).json({ status: 'ok', service: 'trimflow-api' }),
  );
  httpAdapter.head('/', (_req: unknown, res: { status: (n: number) => { end: () => void } }) => {
    res.status(200).end();
  });

  // Migraciones automáticas
  try {
    const dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    logger.log('✅ Migraciones ejecutadas correctamente');

    // Seed automático: solo si la tabla users está vacía
    const userCount = await dataSource.query('SELECT COUNT(*)::int AS count FROM users');
    if (userCount[0]?.count === 0) {
      logger.log('🌱 Base de datos vacía — ejecutando seed de datos demo...');
      await runSeed(dataSource);
      logger.log('✅ Seed de datos demo completado');
    } else {
      logger.log('ℹ️ Base de datos ya tiene datos — seed omitido');
    }
  } catch (error) {
    logger.warn('⚠️ No se pudieron ejecutar migraciones/seed: ' + (error as Error).message);
  }

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TrimFlow API')
    .setDescription('Multi-tenant SaaS para barberías')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  logger.log(`🚀 TrimFlow Backend running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`📖 Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
