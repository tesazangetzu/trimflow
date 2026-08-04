import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import configuration from '../../../config/configuration';
import { TrimflowLoggerModule } from '../../../shared/logger';
import { AppointmentsModule } from '../appointments.module';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../entities/appointment.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Barber } from '../../barbers/entities/barber.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Service } from '../../services/entities/service.entity';
import { User } from '../../auth/entities/user.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';
import { AvailabilityBlock } from '../../schedule/entities/availability-block.entity';
import { Setting } from '../../settings/entities/setting.entity';
import { DoubleBookingError, BusinessRuleViolation } from '../../../shared/exceptions';
import { getTestPostgres } from '../../../../test/testcontainers/connection';

const IDS = {
  t1: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  branch1: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  barberA: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  barberNoSchedule: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  svcA: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  custA: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  t2: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  branch2: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  barberB: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  svcB: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  custB: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
};

function localTime(hour: number, minute: number, dayOffset = 1): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

describe('AppointmentService (Integration)', () => {
  let moduleRef: TestingModule;
  let pgDataSource: DataSource;
  let service: AppointmentService;
  let appointmentRepo: Repository<Appointment>;

  async function seedTenant(opts: {
    tenantId: string;
    branchId: string;
    barberId: string;
    svcId: string;
    custId: string;
    withSchedules?: boolean;
  }) {
    const { tenantId, branchId, barberId, svcId, custId, withSchedules = true } = opts;
    await pgDataSource.query(`
      INSERT INTO tenants (id, name, slug, email, status, "createdAt", "updatedAt")
      VALUES ('${tenantId}', 'Tenant ${tenantId}', 'slug-${tenantId}', 't@t.com', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    await pgDataSource.query(`
      INSERT INTO branches (id, name, address, phone, "tenantId", "createdAt", "updatedAt")
      VALUES ('${branchId}', 'Branch ${branchId}', 'addr', '+56900000000', '${tenantId}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    await pgDataSource.query(`
      INSERT INTO barbers (id, name, email, phone, "branchId", "createdAt", "updatedAt")
      VALUES ('${barberId}', 'Barber ${barberId}', 'barber-${barberId}@e2e.com', '+56911111111', '${branchId}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    if (withSchedules) {
      for (let day = 0; day < 7; day++) {
        await pgDataSource.query(`
          INSERT INTO schedules (id, "barberId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt")
          VALUES ('${barberId.slice(0, 35)}${day}', '${barberId}', ${day}, '09:00', '19:00', true, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
        `);
      }
    }
    await pgDataSource.query(`
      INSERT INTO services (id, name, description, price, "durationMinutes", "branchId", "createdAt", "updatedAt")
      VALUES ('${svcId}', 'Service ${svcId}', 'desc', 15000, 30, '${branchId}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    await pgDataSource.query(`
      INSERT INTO customers (id, name, email, phone, notes, "branchId", "createdAt", "updatedAt")
      VALUES ('${custId}', 'Customer ${custId}', 'c-${custId}@e2e.com', '+56955555555', NULL, '${branchId}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  function makeDto(
    barberId: string,
    start: Date,
    end: Date,
    svcId = IDS.svcA,
    custId = IDS.custA,
  ) {
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      barberId,
      customerId: custId,
      serviceId: svcId,
    };
  }

  beforeAll(async () => {
    const ctx = await getTestPostgres();
    pgDataSource = ctx.dataSource;

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: [], load: [configuration] }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.DATABASE_URL,
          // autoLoadEntities no registra los targets de relaciones no forFeature'd
          // (p.ej. Branch); se listan todas las entidades de forma explícita.
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
        }),
        TrimflowLoggerModule,
        AppointmentsModule,
      ],
    }).compile();

    service = moduleRef.get(AppointmentService);
    appointmentRepo = moduleRef.get(getRepositoryToken(Appointment));
  });

  beforeEach(async () => {
    await pgDataSource.query(
      'TRUNCATE TABLE appointments, availability_blocks, schedules, barbers, customers, services, branches, tenants, users RESTART IDENTITY CASCADE;',
    );
  });

  afterAll(async () => {
    await moduleRef?.close();
    await pgDataSource?.destroy();
  });

  it('persist appointment and return it with relations', async () => {
    await seedTenant({
      tenantId: IDS.t1,
      branchId: IDS.branch1,
      barberId: IDS.barberA,
      svcId: IDS.svcA,
      custId: IDS.custA,
    });

    const start = localTime(10, 0);
    const end = localTime(10, 30);
    const saved = await service.create(makeDto(IDS.barberA, start, end));

    expect(saved.id).toBeDefined();
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.status).toBe('scheduled');

    const found = await service.findOne(saved.id);
    expect(found.id).toBe(saved.id);
    expect(found.barber?.id).toBe(IDS.barberA);
    expect(found.customer?.id).toBe(IDS.custA);
    expect(found.service?.id).toBe(IDS.svcA);
  });

  it('reject double booking for same barber and overlapping range', async () => {
    await seedTenant({
      tenantId: IDS.t1,
      branchId: IDS.branch1,
      barberId: IDS.barberA,
      svcId: IDS.svcA,
      custId: IDS.custA,
    });

    const start = localTime(10, 0);
    const end = localTime(10, 30);
    await service.create(makeDto(IDS.barberA, start, end));

    const overlapStart = localTime(10, 15);
    const overlapEnd = localTime(10, 45);
    await expect(
      service.create(makeDto(IDS.barberA, overlapStart, overlapEnd)),
    ).rejects.toThrow(DoubleBookingError);
  });

  it('enforce tenant isolation at service level', async () => {
    await seedTenant({
      tenantId: IDS.t1,
      branchId: IDS.branch1,
      barberId: IDS.barberA,
      svcId: IDS.svcA,
      custId: IDS.custA,
    });
    await seedTenant({
      tenantId: IDS.t2,
      branchId: IDS.branch2,
      barberId: IDS.barberB,
      svcId: IDS.svcB,
      custId: IDS.custB,
    });

    const start = localTime(10, 0);
    const end = localTime(10, 30);
    await service.create(makeDto(IDS.barberA, start, end, IDS.svcA, IDS.custA));

    const tenantBList = await service.findAll(IDS.barberB);
    expect(tenantBList).toHaveLength(0);

    const tenantBRange = await service.findByBarberAndDateRange(IDS.barberB, start, end);
    expect(tenantBRange).toHaveLength(0);
  });

  it('reject when barber has no schedule for the requested day', async () => {
    await seedTenant({
      tenantId: IDS.t1,
      branchId: IDS.branch1,
      barberId: IDS.barberNoSchedule,
      svcId: IDS.svcA,
      custId: IDS.custA,
      withSchedules: false,
    });

    const start = localTime(10, 0);
    const end = localTime(10, 30);
    await expect(
      service.create(makeDto(IDS.barberNoSchedule, start, end)),
    ).rejects.toThrow(BusinessRuleViolation);
  });

  it('persist cancel/complete status transitions in DB', async () => {
    await seedTenant({
      tenantId: IDS.t1,
      branchId: IDS.branch1,
      barberId: IDS.barberA,
      svcId: IDS.svcA,
      custId: IDS.custA,
    });

    const start = localTime(10, 0);
    const end = localTime(10, 30);
    const created = await service.create(makeDto(IDS.barberA, start, end));

    const completed = await service.complete(created.id);
    expect(completed.status).toBe('completed');
    expect((await service.findOne(created.id)).status).toBe('completed');

    const cancelled = await service.cancel(created.id);
    expect(cancelled.status).toBe('cancelled');
    expect((await appointmentRepo.findOne({ where: { id: created.id } }))?.status).toBe(
      'cancelled',
    );
  });
});
