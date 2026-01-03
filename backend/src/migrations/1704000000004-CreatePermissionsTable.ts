import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePermissionsTable1704000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
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
            name: 'menuManagerId',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
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
        foreignKeys: [
          {
            columnNames: ['menuManagerId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'menu_managers',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Insert default permissions for User Management menu (id: 2)
    await queryRunner.query(`
      INSERT INTO permissions ("menuManagerId", name, slug, description) VALUES
      (2, 'User List', 'user-index', 'View user list'),
      (2, 'User Create', 'user-store', 'Create new user'),
      (2, 'User Update', 'user-update', 'Update existing user'),
      (2, 'User Delete', 'user-destroy', 'Delete user'),
      (2, 'User Show', 'user-show', 'View user details'),
      (3, 'Role List', 'role-index', 'View role list'),
      (3, 'Role Create', 'role-store', 'Create new role'),
      (3, 'Role Update', 'role-update', 'Update existing role'),
      (3, 'Role Delete', 'role-destroy', 'Delete role'),
      (3, 'Role Show', 'role-show', 'View role details'),
      (1, 'Dashboard Access', 'dashboard-index', 'Access dashboard'),
      (4, 'Settings Access', 'settings-index', 'Access settings'),
      (4, 'Settings Update', 'settings-update', 'Update settings')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('permissions');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('menuManagerId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('permissions', foreignKey);
    }
    await queryRunner.dropTable('permissions');
  }
}
