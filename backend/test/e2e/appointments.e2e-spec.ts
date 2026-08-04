import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/create-app';
import { seedE2eData, E2E_IDS } from './helpers/seed';
import { getTestPostgres } from '../testcontainers/connection';

function localTime(hour: number, minute: number, dayOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdId: string;

  const startTime = localTime(10, 0, 1).toISOString();
  const endTime = localTime(10, 30, 1).toISOString();

  beforeAll(async () => {
    const { dataSource } = await getTestPostgres();
    await seedE2eData(dataSource);
    app = await createTestApp();

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin@trimflow.com', password: 'admin123' })
      .expect(201);
    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('POST /v1/appointments creates an appointment (201, status scheduled)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startTime,
        endTime,
        barberId: E2E_IDS.barber1,
        customerId: E2E_IDS.customer1,
        serviceId: E2E_IDS.service1,
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('scheduled');
    expect(res.body.data.barberId).toBe(E2E_IDS.barber1);
    createdId = res.body.data.id;
  });

  it('POST /v1/appointments rejects double booking with 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startTime,
        endTime,
        barberId: E2E_IDS.barber1,
        customerId: E2E_IDS.customer1,
        serviceId: E2E_IDS.service1,
      })
      .expect(409);

    expect(res.body.error).toBeDefined();
  });

  it('POST /v1/appointments rejects barber without schedule with 422', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startTime,
        endTime,
        barberId: E2E_IDS.barber2,
        customerId: E2E_IDS.customer1,
        serviceId: E2E_IDS.service1,
      })
      .expect(422);

    expect(res.body.error).toBeDefined();
  });

  it('GET /v1/appointments returns the created appointment when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    const ids = res.body.data.map((a: { id: string }) => a.id);
    expect(ids).toContain(createdId);
  });

  it('GET /v1/appointments returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/v1/appointments').expect(401);
  });

  it('PATCH /v1/appointments/:id/complete sets status to completed', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/appointments/${createdId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('completed');
  });
});
