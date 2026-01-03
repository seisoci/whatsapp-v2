import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePermissionRoleTable1704000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'permission_role',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'permission_id',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'role_id',
            type: 'bigint',
            unsigned: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['permission_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'permissions',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['role_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'roles',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Assign all permissions to Super Admin (role_id: 1)
    // Assign some permissions to Admin (role_id: 2)
    // Assign basic permissions to User (role_id: 3)
    await queryRunner.query(`
      -- Super Admin gets all permissions
      INSERT INTO permission_role (permission_id, role_id)
      SELECT id, 1 FROM permissions;

      -- Admin gets user and role management permissions
      INSERT INTO permission_role (permission_id, role_id)
      SELECT id, 2 FROM permissions WHERE slug IN (
        'user-index', 'user-show', 'user-update',
        'role-index', 'role-show',
        'dashboard-index',
        'settings-index'
      );

      -- User gets basic permissions
      INSERT INTO permission_role (permission_id, role_id)
      SELECT id, 3 FROM permissions WHERE slug IN (
        'dashboard-index',
        'settings-index'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('permission_role');
    const foreignKeys = table?.foreignKeys || [];

    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey('permission_role', foreignKey);
    }

    await queryRunner.dropTable('permission_role');
  }
}
