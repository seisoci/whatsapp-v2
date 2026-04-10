import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add Analytics menu and permissions
 * Page: /analytics
 */
export class AddAnalyticsMenu1704000000037 implements MigrationInterface {
  name = 'AddAnalyticsMenu1704000000037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert menu for analytics
    await queryRunner.query(`
      INSERT INTO menu_managers ("parentId", title, slug, "pathUrl", icon, type, position, sort)
      VALUES (0, 'Analytics', 'analytics', '/analytics', 'PiChartBarDuotone', 'module', 'sidebar', 2)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        "pathUrl" = EXCLUDED."pathUrl",
        icon = EXCLUDED.icon,
        type = EXCLUDED.type,
        position = EXCLUDED.position,
        sort = EXCLUDED.sort
    `);

    // Get the menu id
    const [menu] = await queryRunner.query(
      `SELECT id FROM menu_managers WHERE slug = 'analytics'`
    );
    const menuId = menu?.id;
    if (!menuId) return;

    // Insert permissions
    const permissions = [
      { slug: 'analytics-index', name: 'Analytics View', description: 'View analytics dashboard' },
    ];

    for (const perm of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions ("menuManagerId", name, slug, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET
           "menuManagerId" = EXCLUDED."menuManagerId",
           name = EXCLUDED.name,
           description = EXCLUDED.description`,
        [menuId, perm.name, perm.slug, perm.description]
      );
    }

    // Assign all new permissions to Super Admin (role_id = 1)
    const newPermissions = await queryRunner.query(
      `SELECT id FROM permissions WHERE slug = 'analytics-index'`
    );

    for (const perm of newPermissions) {
      const exists = await queryRunner.query(
        `SELECT 1 FROM permission_role WHERE permission_id = $1 AND role_id = $2`,
        [perm.id, '1']
      );
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO permission_role (permission_id, role_id) VALUES ($1, $2)`,
          [perm.id, '1']
        );
      }
    }

    // Assign menu to Super Admin
    const menuExists = await queryRunner.query(
      `SELECT 1 FROM menu_manager_role WHERE menu_manager_id = $1 AND role_id = $2`,
      [menuId, '1']
    );
    if (menuExists.length === 0) {
      await queryRunner.query(
        `INSERT INTO menu_manager_role (menu_manager_id, role_id) VALUES ($1, $2)`,
        [menuId, '1']
      );
    }

    console.log('✅ Analytics menu and permissions seeded successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM permissions WHERE slug = 'analytics-index'`);
    await queryRunner.query(`DELETE FROM menu_managers WHERE slug = 'analytics'`);
  }
}
