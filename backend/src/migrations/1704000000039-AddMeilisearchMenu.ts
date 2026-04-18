import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed menu_managers dan permissions untuk halaman Meilisearch Admin.
 * Ditempatkan di bawah grup Management.
 */
export class AddMeilisearchMenu1704000000039 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Upsert menu entry
    await queryRunner.query(`
      INSERT INTO menu_managers ("parentId", title, slug, "pathUrl", icon, type, position, sort)
      VALUES (0, 'Meilisearch', 'meilisearch', '/meilisearch', 'PiMagnifyingGlassDuotone', 'module', 'sidebar', 14)
      ON CONFLICT (slug) DO UPDATE SET
        title     = EXCLUDED.title,
        "pathUrl" = EXCLUDED."pathUrl",
        icon      = EXCLUDED.icon,
        type      = EXCLUDED.type,
        position  = EXCLUDED.position,
        sort      = EXCLUDED.sort
    `);

    // Get menu id
    const menus = await queryRunner.query(
      `SELECT id FROM menu_managers WHERE slug = 'meilisearch'`
    );
    const menuId: string = menus[0]?.id;
    if (!menuId) return;

    // Upsert permissions
    const permissions = [
      { slug: 'meilisearch-index',   name: 'Meilisearch List',   description: 'View Meilisearch indexes' },
      { slug: 'meilisearch-store',   name: 'Meilisearch Sync',   description: 'Resync Meilisearch indexes' },
      { slug: 'meilisearch-destroy', name: 'Meilisearch Delete',  description: 'Delete Meilisearch index documents' },
    ];

    for (const perm of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions ("menuManagerId", name, slug, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET
           "menuManagerId" = EXCLUDED."menuManagerId",
           name            = EXCLUDED.name,
           description     = EXCLUDED.description`,
        [menuId, perm.name, perm.slug, perm.description]
      );
    }

    // Assign menu + permissions to Super Admin (role_id = 1)
    const rows = await queryRunner.query(
      `SELECT id FROM permissions WHERE slug IN ('meilisearch-index', 'meilisearch-store', 'meilisearch-destroy')`
    );

    for (const row of rows) {
      const exists = await queryRunner.query(
        `SELECT 1 FROM permission_role WHERE permission_id = $1 AND role_id = '1'`,
        [row.id]
      );
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO permission_role (permission_id, role_id) VALUES ($1, '1')`,
          [row.id]
        );
      }
    }

    const menuExists = await queryRunner.query(
      `SELECT 1 FROM menu_manager_role WHERE menu_manager_id = $1 AND role_id = '1'`,
      [menuId]
    );
    if (menuExists.length === 0) {
      await queryRunner.query(
        `INSERT INTO menu_manager_role (menu_manager_id, role_id) VALUES ($1, '1')`,
        [menuId]
      );
    }

    console.log('✅ Meilisearch menu and permissions seeded');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM permissions WHERE slug IN ('meilisearch-index', 'meilisearch-store', 'meilisearch-destroy')
    `);
    await queryRunner.query(`
      DELETE FROM menu_managers WHERE slug = 'meilisearch'
    `);
  }
}
