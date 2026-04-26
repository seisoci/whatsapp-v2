import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsHiddenToPhoneNumbers1704000000041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE phone_numbers
      ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE phone_numbers DROP COLUMN IF EXISTS is_hidden
    `);
  }
}
