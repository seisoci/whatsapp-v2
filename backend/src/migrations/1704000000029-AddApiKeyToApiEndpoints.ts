import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add api_key column to api_endpoints table
 */
export class AddApiKeyToApiEndpoints1704000000029 implements MigrationInterface {
  name = 'AddApiKeyToApiEndpoints1704000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add api_key column
    await queryRunner.query(`
      ALTER TABLE "api_endpoints" 
      ADD COLUMN "api_key" VARCHAR(255)
    `);

    // Create index for api_key lookup
    await queryRunner.query(`
      CREATE INDEX "IDX_api_endpoints_api_key" ON "api_endpoints" ("api_key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_endpoints_api_key"`);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "api_endpoints" DROP COLUMN "api_key"
    `);
  }
}
