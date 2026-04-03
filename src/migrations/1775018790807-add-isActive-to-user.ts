import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveToUser1775018790807 implements MigrationInterface {
    name = 'AddIsActiveToUser1775018790807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
    }

}
