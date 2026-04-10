import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create template_role_access table
 * Menyimpan akses role ke template WhatsApp (many-to-many)
 * Template tidak memiliki tabel sendiri karena data berasal dari WhatsApp API
 */
export class CreateTemplateRoleAccessTable1704000000035 implements MigrationInterface {
  name = 'CreateTemplateRoleAccessTable1704000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "template_role_access" (
        "id"              BIGSERIAL PRIMARY KEY,
        "template_id"     VARCHAR(255) NOT NULL,
        "template_name"   VARCHAR(255) NOT NULL,
        "waba_id"         VARCHAR(255) NOT NULL,
        "phone_number_id" UUID NOT NULL,
        "role_id"         BIGINT NOT NULL,
        "created_at"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "fk_tra_phone_number" FOREIGN KEY ("phone_number_id")
          REFERENCES "phone_numbers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_tra_role" FOREIGN KEY ("role_id")
          REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_tra_template_role" UNIQUE ("template_id", "phone_number_id", "role_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tra_template_id" ON "template_role_access" ("template_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tra_role_id" ON "template_role_access" ("role_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tra_phone_number_id" ON "template_role_access" ("phone_number_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tra_phone_number_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tra_role_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tra_template_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "template_role_access"`);
  }
}
