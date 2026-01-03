import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMenuManagerRoleTable1704000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'menu_manager_role',
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
            name: 'menu_manager_id',
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
            columnNames: ['menu_manager_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'menu_managers',
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

    // Assign menus to roles
    await queryRunner.query(`
      -- Super Admin gets all menus
      INSERT INTO menu_manager_role (menu_manager_id, role_id)
      SELECT id, 1 FROM menu_managers;

      -- Admin gets dashboard, user management, role management
      INSERT INTO menu_manager_role (menu_manager_id, role_id)
      SELECT id, 2 FROM menu_managers WHERE slug IN ('dashboard', 'user-management', 'role-management', 'settings');

      -- User gets dashboard and settings only
      INSERT INTO menu_manager_role (menu_manager_id, role_id)
      SELECT id, 3 FROM menu_managers WHERE slug IN ('dashboard', 'settings');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('menu_manager_role');
    const foreignKeys = table?.foreignKeys || [];

    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey('menu_manager_role', foreignKey);
    }

    await queryRunner.dropTable('menu_manager_role');
  }
}
