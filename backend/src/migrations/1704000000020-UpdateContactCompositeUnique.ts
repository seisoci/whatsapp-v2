import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContactCompositeUnique1704000000020 implements MigrationInterface {
  name = 'UpdateContactCompositeUnique1704000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old unique constraint on wa_id
    await queryRunner.query(`
      ALTER TABLE "contacts" 
      DROP CONSTRAINT IF EXISTS "UQ_452c624ef116a33bdcdb3263055"
    `);

    // Create composite unique constraint on (wa_id, phone_number_id)
    await queryRunner.query(`
      ALTER TABLE "contacts" 
      ADD CONSTRAINT "UQ_contacts_wa_id_phone_number_id" 
      UNIQUE ("wa_id", "phone_number_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop composite unique constraint
    await queryRunner.query(`
      ALTER TABLE "contacts" 
      DROP CONSTRAINT IF EXISTS "UQ_contacts_wa_id_phone_number_id"
    `);

    // Restore old unique constraint on wa_id (note: this will fail if there are duplicate wa_ids)
    await queryRunner.query(`
      ALTER TABLE "contacts" 
      ADD CONSTRAINT "UQ_452c624ef116a33bdcdb3263055" 
      UNIQUE ("wa_id")
    `);
  }
}
