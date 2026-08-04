import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/create-app';
import { seedE2eData, E2E_IDS } from './helpers/seed';
import { getTestPostgres } from '../testcontainers/connection';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const { dataSource } = await getTestPostgres();
    await seedE2eData(dataSource);
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('POST /v1/auth/login returns tokens for super admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'super@trimflow.com', password: 'super123' })
      .expect(201);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('POST /v1/auth/login rejects wrong password with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'super@trimflow.com', password: 'wrong-password' })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  it('POST /v1/auth/login rejects nonexistent email with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'noexiste@trimflow.com', password: 'password123' })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  it('POST /v1/auth/refresh rotates tokens', async () => {
    // Los JWT se firman con iat (segundos). Si login y refresh ocurren en el
    // mismo segundo, el token re-firmado es byte-idéntico; esperamos >1s para
    // validar la rotación de forma determinista.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.accessToken).not.toBe(accessToken);
  });

  it('POST /v1/auth/refresh rejects invalid token with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: 'not-a-valid-jwt' })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  it('GET /v1/auth/me returns current user with Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveProperty('id', E2E_IDS.superAdmin);
    expect(res.body.data.email).toBe('super@trimflow.com');
  });

  it('GET /v1/auth/me returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
  });
});
