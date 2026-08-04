import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config();

/**
 * Ejecuta el seed de datos demo usando un DataSource ya inicializado.
 * Es idempotente (usa ON CONFLICT DO NOTHING), por lo que puede ejecutarse
 * varias veces sin duplicar datos.
 */
export async function runSeed(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();

  console.log('🌱 Seeding demo data...');

  try {
    // Usamos UUIDs fijos pre-generados para mantener referencias entre tablas
    const tenant1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const tenant2 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    const branch1 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const branch2 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    const branch3 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    const barber1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const barber2 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    const barber3 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    const barber4 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    const svc1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const svc2 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    const svc3 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    const svc4 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    const svc5 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';
    const svc6 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';
    const svc7 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17';
    const cust1 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const cust2 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    const cust3 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    const cust4 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    const cust5 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';

    // ─── Tenants ───
    await queryRunner.query(`
      INSERT INTO tenants (id, name, slug, email, status, settings, "createdAt", "updatedAt")
      VALUES
        ('${tenant1}', 'Barbería El Clásico', 'barberia-el-clasico', 'contacto@elclasico.com', 'active', '{"currency":"CLP","timezone":"America/Santiago"}', NOW(), NOW()),
        ('${tenant2}', 'Studio 42', 'studio-42', 'hola@studio42.cl', 'active', '{"currency":"CLP","timezone":"America/Santiago"}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Tenants created');

    // ─── Branches ───
    await queryRunner.query(`
      INSERT INTO branches (id, name, address, phone, "openingTime", "closingTime", "tenantId", "createdAt", "updatedAt")
      VALUES
        ('${branch1}', 'Sucursal Centro', 'Av. Libertador 123', '+56912345678', '09:00', '19:00', '${tenant1}', NOW(), NOW()),
        ('${branch2}', 'Sucursal Norte', 'Av. Del Valle 456', '+56987654321', '10:00', '20:00', '${tenant1}', NOW(), NOW()),
        ('${branch3}', 'Studio 42 Providencia', 'Providencia 789', '+56956789012', '09:00', '18:00', '${tenant2}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Branches created');

    // ─── Barbers ───
    await queryRunner.query(`
      INSERT INTO barbers (id, name, email, phone, "branchId", "createdAt", "updatedAt")
      VALUES
        ('${barber1}', 'Carlos Muñoz', 'carlos@elclasico.com', '+56911111111', '${branch1}', NOW(), NOW()),
        ('${barber2}', 'María González', 'maria@elclasico.com', '+56922222222', '${branch1}', NOW(), NOW()),
        ('${barber3}', 'Pedro Ramírez', 'pedro@elclasico.com', '+56933333333', '${branch2}', NOW(), NOW()),
        ('${barber4}', 'Ana Soto', 'ana@studio42.cl', '+56944444444', '${branch3}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Barbers created');

    // ─── Services ───
    await queryRunner.query(`
      INSERT INTO services (id, name, description, price, "durationMinutes", "branchId", "createdAt", "updatedAt")
      VALUES
        ('${svc1}', 'Corte de cabello', 'Corte clásico con tijera o máquina', 15000, 30, '${branch1}', NOW(), NOW()),
        ('${svc2}', 'Barba completa', 'Arreglo de barba con navaja', 10000, 20, '${branch1}', NOW(), NOW()),
        ('${svc3}', 'Corte + Barba', 'Combo corte de cabello y barba', 22000, 45, '${branch1}', NOW(), NOW()),
        ('${svc4}', 'Corte infantil', 'Corte para niños hasta 12 años', 12000, 25, '${branch1}', NOW(), NOW()),
        ('${svc5}', 'Corte degradado', 'Corte fade con máquina', 18000, 35, '${branch2}', NOW(), NOW()),
        ('${svc6}', 'Tinte completo', 'Tinte de cabello completo', 35000, 90, '${branch3}', NOW(), NOW()),
        ('${svc7}', 'Corte moderno', 'Corte de tendencia', 25000, 45, '${branch3}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Services created');

    // ─── Customers ───
    await queryRunner.query(`
      INSERT INTO customers (id, name, email, phone, notes, "branchId", "createdAt", "updatedAt")
      VALUES
        ('${cust1}', 'Juan Pérez', 'juan@email.com', '+56955555555', 'Cliente prefiere los martes', '${branch1}', NOW(), NOW()),
        ('${cust2}', 'Roberto Díaz', 'roberto@email.com', '+56966666666', NULL, '${branch1}', NOW(), NOW()),
        ('${cust3}', 'Luis Martínez', 'luis@email.com', '+56977777777', 'Alérgico a ciertos productos', '${branch2}', NOW(), NOW()),
        ('${cust4}', 'Claudia Rojas', 'claudia@email.com', '+56988888888', 'Prefiere atención con Ana', '${branch3}', NOW(), NOW()),
        ('${cust5}', 'Diego Soto', 'diego@email.com', '+56999999999', NULL, '${branch1}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Customers created');

    // ─── Appointments ───
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    await queryRunner.query(`
      INSERT INTO appointments (id, "startTime", "endTime", status, notes, "barberId", "customerId", "serviceId", "createdAt", "updatedAt")
      VALUES
        ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '${todayStr}T10:00:00.000Z', '${todayStr}T10:30:00.000Z', 'scheduled', NULL, '${barber1}', '${cust1}', '${svc1}', NOW(), NOW()),
        ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '${todayStr}T11:00:00.000Z', '${todayStr}T11:45:00.000Z', 'scheduled', 'Confirmar 24h antes', '${barber1}', '${cust2}', '${svc3}', NOW(), NOW()),
        ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '${todayStr}T09:00:00.000Z', '${todayStr}T09:30:00.000Z', 'completed', NULL, '${barber2}', '${cust5}', '${svc1}', NOW(), NOW()),
        ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '${todayStr}T15:00:00.000Z', '${todayStr}T15:35:00.000Z', 'scheduled', NULL, '${barber3}', '${cust3}', '${svc5}', NOW(), NOW()),
        ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '${todayStr}T14:00:00.000Z', '${todayStr}T15:30:00.000Z', 'scheduled', 'Tinte completo', '${barber4}', '${cust4}', '${svc6}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Appointments created');

    // ─── Users (auth) ───
    const salt = await bcrypt.genSalt(10);
    const pwdSuper = await bcrypt.hash('super123', salt);
    const pwdAdmin = await bcrypt.hash('admin123', salt);
    const pwdBarber = await bcrypt.hash('barber123', salt);

    await queryRunner.query(`
      INSERT INTO users (id, name, email, password, role, "tenantId", "isActive", "createdAt", "updatedAt")
      VALUES
        ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Super Admin', 'super@trimflow.com', '${pwdSuper}', 'super-admin', NULL, true, NOW(), NOW()),
        ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Admin Barbería', 'admin@trimflow.com', '${pwdAdmin}', 'admin', '${tenant1}', true, NOW(), NOW()),
        ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Carlos Muñoz', 'carlos@elclasico.com', '${pwdBarber}', 'barber', '${tenant1}', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Users created');

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Ejecución directa como script CLI (npm run seed:run)
async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['src/**/*.entity.ts'],
    logging: false,
  });

  await dataSource.initialize();
  try {
    await runSeed(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

// Solo se ejecuta como script directo (no cuando se importa desde main.ts)
if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
