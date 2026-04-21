import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserPhoneNumbersTable1704000000040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_phone_numbers (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phone_number_id UUID NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, phone_number_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_phone_numbers_user_id ON user_phone_numbers (user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_phone_numbers_phone_number_id ON user_phone_numbers (phone_number_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_phone_numbers`);
  }
}
