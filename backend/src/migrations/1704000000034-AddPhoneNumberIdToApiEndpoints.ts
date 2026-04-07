import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add phone_number_id FK column to api_endpoints table.
 * This links each API endpoint to a specific WhatsApp sender phone number.
 */
export class AddPhoneNumberIdToApiEndpoints1704000000034 implements MigrationInterface {
  name = 'AddPhoneNumberIdToApiEndpoints1704000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "api_endpoints"
      ADD COLUMN "phone_number_id" UUID,
      ADD CONSTRAINT "fk_api_endpoints_phone_number"
        FOREIGN KEY ("phone_number_id")
        REFERENCES "phone_numbers"("id")
        ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_endpoints_phone_number_id"
      ON "api_endpoints" ("phone_number_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_endpoints_phone_number_id"`);
    await queryRunner.query(`
      ALTER TABLE "api_endpoints"
      DROP CONSTRAINT IF EXISTS "fk_api_endpoints_phone_number",
      DROP COLUMN IF EXISTS "phone_number_id"
    `);
  }
}
