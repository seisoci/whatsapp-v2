import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add is_archived column to contacts table
 * This enables the archived chat feature like WhatsApp
 */
export class AddIsArchivedToContacts1704000000027 implements MigrationInterface {
  name = 'AddIsArchivedToContacts1704000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_archived column with default false
    await queryRunner.query(`
      ALTER TABLE "contacts" 
      ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false
    `);

    // Create partial index for efficiently querying archived contacts
    await queryRunner.query(`
      CREATE INDEX "IDX_contacts_is_archived_phone_number" 
      ON "contacts" ("phone_number_id", "is_archived") 
      WHERE "is_archived" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_contacts_is_archived_phone_number"
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "contacts" DROP COLUMN "is_archived"
    `);
  }
}
