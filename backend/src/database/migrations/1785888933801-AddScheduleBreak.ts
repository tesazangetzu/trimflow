import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduleBreak1785888933801 implements MigrationInterface {
    name = 'AddScheduleBreak1785888933801'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "schedules" ADD COLUMN "breakStartTime" TIME NULL`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD COLUMN "breakEndTime" TIME NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "breakEndTime"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "breakStartTime"`);
    }

}