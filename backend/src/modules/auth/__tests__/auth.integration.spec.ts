import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import configuration from '../../../config/configuration';
import { validationSchema } from '../../../config/validation.schema';
import { TrimflowLoggerModule } from '../../../shared/logger';
import { AuthModule } from '../auth.module';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';
import { UnauthorizedError, BusinessRuleViolation } from '../../../shared/exceptions';
import { getTestPostgres } from '../../../../test/testcontainers/connection';

describe('AuthService (Integration)', () => {
  let moduleRef: TestingModule;
  let pgDataSource: DataSource;
  let service: AuthService;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const ctx = await getTestPostgres();
    pgDataSource = ctx.dataSource;

    // validationSchema exige REDIS_URL aunque Auth no lo use
    process.env.REDIS_URL = 'redis://localhost:6379';

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [],
          load: [configuration],
          validationSchema,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.DATABASE_URL,
          autoLoadEntities: true,
        }),
        TrimflowLoggerModule,
        AuthModule,
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    userRepo = moduleRef.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await pgDataSource.query('TRUNCATE TABLE users, appointments, availability_blocks, schedules, barbers, customers, services, branches, tenants RESTART IDENTITY CASCADE;');
  });

  afterAll(async () => {
    await moduleRef?.close();
    await pgDataSource?.destroy();
  });

  it('login against real DB returns decodable JWT tokens', async () => {
    await service.register({
      name: 'Alice',
      email: 'alice@trimflow.com',
      password: 'alice123',
    });

    const result = await service.login({ email: 'alice@trimflow.com', password: 'alice123' });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const accessPayload = JSON.parse(
      Buffer.from(result.accessToken.split('.')[1], 'base64url').toString('utf-8'),
    );
    expect(accessPayload.email).toBe('alice@trimflow.com');
    expect(accessPayload.role).toBe('admin');
  });

  it('login rejects wrong password with UnauthorizedError', async () => {
    await service.register({
      name: 'Bob',
      email: 'bob@trimflow.com',
      password: 'bob12345',
    });

    await expect(
      service.login({ email: 'bob@trimflow.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('register persists a hashed password and rejects duplicate emails', async () => {
    await service.register({
      name: 'Carlos',
      email: 'carlos@trimflow.com',
      password: 'carlos123',
    });

    const persisted = await userRepo.findOne({ where: { email: 'carlos@trimflow.com' } });
    expect(persisted).not.toBeNull();
    expect(persisted!.password).not.toBe('carlos123');
    expect(await bcrypt.compare('carlos123', persisted!.password)).toBe(true);

    await expect(
      service.register({
        name: 'Carlos Duplicado',
        email: 'carlos@trimflow.com',
        password: 'carlos456',
      }),
    ).rejects.toThrow(BusinessRuleViolation);
  });

  it('refresh rotates tokens and rejects invalid tokens', async () => {
    const registered = await service.register({
      name: 'Diana',
      email: 'diana@trimflow.com',
      password: 'diana123',
    });

    // iat en segundos: esperamos >1s para que el token re-firmado sea distinto
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const refreshed = await service.refresh({ refreshToken: registered.refreshToken });
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.accessToken).not.toBe(registered.accessToken);

    await expect(service.refresh({ refreshToken: 'not-a-valid-jwt' })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
