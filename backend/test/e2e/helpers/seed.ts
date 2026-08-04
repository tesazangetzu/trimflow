import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

/**
 * IDs fijos (mismo formato que el demo-seed de desarrollo).
 * Se usan ON CONFLICT DO NOTHING para que el seed sea idempotente.
 */
export const E2E_IDS = {
  tenant1: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  branch1: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  barber1: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  barber2: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  service1: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  customer1: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  superAdmin: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  admin: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
};

export async function seedE2eData(dataSource: DataSource): Promise<void> {
  const qr = dataSource.createQueryRunner();
  try {
    await qr.query(`
      INSERT INTO tenants (id, name, slug, email, status, settings, "createdAt", "updatedAt")
      VALUES ('${E2E_IDS.tenant1}', 'E2E Barber Shop', 'e2e-barber-shop', 'e2e@trimflow.com', 'active', '{}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    await qr.query(`
      INSERT INTO branches (id, name, address, phone, "openingTime", "closingTime", "tenantId", "createdAt", "updatedAt")
      VALUES ('${E2E_IDS.branch1}', 'E2E Branch', 'E2E St 123', '+56900000000', '09:00', '19:00', '${E2E_IDS.tenant1}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    await qr.query(`
      INSERT INTO barbers (id, name, email, phone, "branchId", "createdAt", "updatedAt")
      VALUES
        ('${E2E_IDS.barber1}', 'E2E Barber Uno', 'barber1@e2e.com', '+56911111111', '${E2E_IDS.branch1}', NOW(), NOW()),
        ('${E2E_IDS.barber2}', 'E2E Barber Dos', 'barber2@e2e.com', '+56922222222', '${E2E_IDS.branch1}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    await qr.query(`
      INSERT INTO services (id, name, description, price, "durationMinutes", "branchId", "createdAt", "updatedAt")
      VALUES ('${E2E_IDS.service1}', 'E2E Corte', 'Corte e2e', 15000, 30, '${E2E_IDS.branch1}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    await qr.query(`
      INSERT INTO customers (id, name, email, phone, notes, "branchId", "createdAt", "updatedAt")
      VALUES ('${E2E_IDS.customer1}', 'E2E Cliente', 'cliente@e2e.com', '+56955555555', NULL, '${E2E_IDS.branch1}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    const pwdSuper = await bcrypt.hash('super123', 10);
    const pwdAdmin = await bcrypt.hash('admin123', 10);

    await qr.query(`
      INSERT INTO users (id, name, email, password, role, "tenantId", "isActive", "createdAt", "updatedAt")
      VALUES
        ('${E2E_IDS.superAdmin}', 'E2E Super Admin', 'super@trimflow.com', '${pwdSuper}', 'super-admin', NULL, true, NOW(), NOW()),
        ('${E2E_IDS.admin}', 'E2E Admin', 'admin@trimflow.com', '${pwdAdmin}', 'admin', '${E2E_IDS.tenant1}', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Schedules para Barber1: TODOS los días 0-6, 09:00-19:00.
    // Crítico: ScheduleService.isBarberAvailable usa start.getDay() local y exige una fila de schedule.
    for (let day = 0; day < 7; day++) {
      await qr.query(`
        INSERT INTO schedules (id, "barberId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt")
        VALUES ('${E2E_IDS.barber1.slice(0, 35)}${day}', '${E2E_IDS.barber1}', ${day}, '09:00', '19:00', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
    }
  } finally {
    await qr.release();
  }
}
