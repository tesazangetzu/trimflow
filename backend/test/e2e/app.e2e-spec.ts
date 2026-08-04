import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/create-app';
import { seedE2eData } from './helpers/seed';
import { getTestPostgres } from '../testcontainers/connection';

describe('TrimFlow API (e2e) — smoke de recursos autenticados', () => {
  let app: INestApplication;
  let accessToken: string;

  const resources = [
    'tenants',
    'branches',
    'barbers',
    'customers',
    'services',
    'appointments',
    'settings',
    'notifications',
  ];

  beforeAll(async () => {
    const { dataSource } = await getTestPostgres();
    await seedE2eData(dataSource);
    app = await createTestApp();

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'super@trimflow.com', password: 'super123' })
      .expect(201);
    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it.each(resources)('GET /v1/%s returns 200 with array payload', async (resource) => {
    const res = await request(app.getHttpServer())
      .get(`/v1/${resource}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
