import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduleTables1785316874524 implements MigrationInterface {
    name = 'AddScheduleTables1785316874524'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "barberId" uuid NOT NULL, "dayOfWeek" smallint NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "availability_blocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "barberId" uuid NOT NULL, "startDateTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endDateTime" TIMESTAMP WITH TIME ZONE NOT NULL, "reason" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_954296de8b743d25b9550b087e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_b5e86df4edbac28732657b787e7" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "availability_blocks" ADD CONSTRAINT "FK_36a91b3e46840f9389db26db469" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability_blocks" DROP CONSTRAINT "FK_36a91b3e46840f9389db26db469"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_b5e86df4edbac28732657b787e7"`);
        await queryRunner.query(`DROP TABLE "availability_blocks"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
    }

}
