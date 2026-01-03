import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMenuManagersTable1704000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'menu_managers',
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
            name: 'parentId',
            type: 'smallint',
            default: 0,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'pathUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['module', 'header', 'line', 'static'],
          },
          {
            name: 'position',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sort',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Insert default menus
    await queryRunner.query(`
      INSERT INTO menu_managers ("parentId", title, slug, "pathUrl", icon, type, position, sort) VALUES
      (0, 'Dashboard', 'dashboard', '/dashboard', 'home', 'module', 'sidebar', 1),
      (0, 'User Management', 'user-management', '/users', 'users', 'module', 'sidebar', 2),
      (0, 'Role Management', 'role-management', '/roles', 'shield', 'module', 'sidebar', 3),
      (0, 'Settings', 'settings', '/settings', 'settings', 'module', 'sidebar', 4)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('menu_managers');
  }
}
