import { MigrationInterface, QueryRunner } from "typeorm";

export class EnforceUniqueSchedulePerBarberDay1786860784035 implements MigrationInterface {
    name = 'EnforceUniqueSchedulePerBarberDay1786860784035'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "schedules" SET "deletedAt" = now() WHERE "id" IN (SELECT "id" FROM (SELECT "id", row_number() OVER (PARTITION BY "barberId", "dayOfWeek" ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC) AS rn FROM "schedules" WHERE "deletedAt" IS NULL) t WHERE t.rn > 1)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_schedules_barberId_dayOfWeek" ON "schedules" ("barberId", "dayOfWeek") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_schedules_barberId_dayOfWeek"`);
    }

}
