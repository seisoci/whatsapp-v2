import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToUsersTable1704000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add roleId column to users table with foreign key constraint
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN "roleId" bigint,
      ADD CONSTRAINT "FK_users_role"
        FOREIGN KEY ("roleId")
        REFERENCES roles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    `);

    // Set default role (User - id: 3) for existing users
    await queryRunner.query(`
      UPDATE users SET "roleId" = 3 WHERE "roleId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('roleId') !== -1);

    if (foreignKey) {
      await queryRunner.dropForeignKey('users', foreignKey);
    }

    await queryRunner.dropColumn('users', 'roleId');
  }
}
