import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create api_endpoints table for managing external API endpoints
 * with status (active/inactive) and webhook URLs
 */
export class CreateApiEndpointsTable1704000000028 implements MigrationInterface {
  name = 'CreateApiEndpointsTable1704000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create api_endpoints table
    await queryRunner.query(`
      CREATE TABLE "api_endpoints" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "webhook_url" VARCHAR(500) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_by" UUID,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_api_endpoints_created_by" FOREIGN KEY ("created_by") 
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create index for faster lookup by is_active status
    await queryRunner.query(`
      CREATE INDEX "IDX_api_endpoints_is_active" ON "api_endpoints" ("is_active")
    `);

    // Create index for name lookup
    await queryRunner.query(`
      CREATE INDEX "IDX_api_endpoints_name" ON "api_endpoints" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_endpoints_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_endpoints_is_active"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "api_endpoints"`);
  }
}
