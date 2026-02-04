import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration untuk sinkronisasi semua menu frontend ke backend
 * Menu ini harus sesuai dengan beryllium-fixed-menu-items.tsx
 *
 * Structure:
 * - Dashboard (/)
 * - Chat (/chat)
 * - WhatsApp (parent)
 *   - Phone Numbers (/phone-numbers)
 *   - Contacts (/contacts)
 *   - Quick Replies (/quick-replies)
 *   - Templates (/templates)
 * - Management (parent)
 *   - Users (/users)
 *   - Roles (/roles)
 *   - Permissions (/permissions)
 *   - Webhook (/api-management)
 *   - Message Queue (/message-queues)
 */
export class SeedAllMenusAndPermissions1704000000032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear existing data (optional - comment out if you want to keep existing data)
    // await queryRunner.query(`DELETE FROM permission_role`);
    // await queryRunner.query(`DELETE FROM permissions`);
    // await queryRunner.query(`DELETE FROM menu_manager_role`);
    // await queryRunner.query(`DELETE FROM menu_managers`);

    // Insert all menus matching frontend structure
    // Using UPSERT (ON CONFLICT DO UPDATE) to avoid duplicates
    await queryRunner.query(`
      INSERT INTO menu_managers ("parentId", title, slug, "pathUrl", icon, type, position, sort)
      VALUES
        -- Main Menu Items
        (0, 'Dashboard', 'dashboard', '/', 'PiHouseDuotone', 'module', 'sidebar', 1),
        (0, 'Chat', 'chat', '/chat', 'PiChatsDuotone', 'module', 'sidebar', 2),

        -- WhatsApp Parent Menu (no direct URL)
        (0, 'WhatsApp', 'whatsapp', '', 'PiWhatsappLogoDuotone', 'header', 'sidebar', 3),

        -- WhatsApp Sub Menus
        (0, 'Phone Numbers', 'phone-number', '/phone-numbers', 'PiDeviceMobileDuotone', 'module', 'sidebar', 4),
        (0, 'Contacts', 'contact', '/contacts', 'PiAddressBookDuotone', 'module', 'sidebar', 5),
        (0, 'Quick Replies', 'quick-reply', '/quick-replies', 'PiEnvelopeDuotone', 'module', 'sidebar', 6),
        (0, 'Templates', 'template', '/templates', 'PiFileTextDuotone', 'module', 'sidebar', 7),

        -- Management Parent Menu (no direct URL)
        (0, 'Management', 'management', '', 'PiUserGearDuotone', 'header', 'sidebar', 8),

        -- Management Sub Menus
        (0, 'Users', 'user', '/users', 'PiUserDuotone', 'module', 'sidebar', 9),
        (0, 'Roles', 'role', '/roles', 'PiShieldCheckDuotone', 'module', 'sidebar', 10),
        (0, 'Permissions', 'permission', '/permissions', 'PiLockKeyDuotone', 'module', 'sidebar', 11),
        (0, 'Webhook', 'webhook', '/api-management', 'PiLockKeyDuotone', 'module', 'sidebar', 12),
        (0, 'Message Queue', 'message-queue', '/message-queues', 'PiEnvelopeDuotone', 'module', 'sidebar', 13)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        "pathUrl" = EXCLUDED."pathUrl",
        icon = EXCLUDED.icon,
        type = EXCLUDED.type,
        position = EXCLUDED.position,
        sort = EXCLUDED.sort
    `);

    // Get menu IDs for permission assignment
    const menus = await queryRunner.query(`
      SELECT id, slug FROM menu_managers WHERE slug IN (
        'dashboard', 'chat', 'phone-number', 'contact', 'quick-reply', 'template',
        'user', 'role', 'permission', 'webhook', 'message-queue'
      )
    `);

    const menuMap: Record<string, string> = {};
    for (const menu of menus) {
      menuMap[menu.slug] = menu.id;
    }

    // Define CRUD permissions for each menu
    const permissionsData = [
      // Dashboard - hanya index
      { menuSlug: 'dashboard', resource: 'dashboard', actions: ['index'] },

      // Chat
      { menuSlug: 'chat', resource: 'chat', actions: ['index', 'store', 'update', 'destroy'] },

      // WhatsApp - Phone Numbers
      { menuSlug: 'phone-number', resource: 'phone-number', actions: ['index', 'store', 'update', 'destroy'] },

      // WhatsApp - Contacts
      { menuSlug: 'contact', resource: 'contact', actions: ['index', 'store', 'update', 'destroy'] },

      // WhatsApp - Quick Replies
      { menuSlug: 'quick-reply', resource: 'quick-reply', actions: ['index', 'store', 'update', 'destroy'] },

      // WhatsApp - Templates
      { menuSlug: 'template', resource: 'template', actions: ['index', 'store', 'update', 'destroy'] },

      // Management - Users
      { menuSlug: 'user', resource: 'user', actions: ['index', 'store', 'update', 'destroy'] },

      // Management - Roles
      { menuSlug: 'role', resource: 'role', actions: ['index', 'store', 'update', 'destroy'] },

      // Management - Permissions
      { menuSlug: 'permission', resource: 'permission', actions: ['index', 'store', 'update', 'destroy'] },

      // Management - Webhook
      { menuSlug: 'webhook', resource: 'webhook', actions: ['index', 'store', 'update', 'destroy'] },

      // Management - Message Queue
      { menuSlug: 'message-queue', resource: 'message-queue', actions: ['index', 'store', 'update', 'destroy'] },
    ];

    const actionNames: Record<string, string> = {
      index: 'List',
      store: 'Create',
      update: 'Update',
      destroy: 'Delete',
    };

    // Insert permissions
    for (const perm of permissionsData) {
      const menuId = menuMap[perm.menuSlug];
      if (!menuId) continue;

      for (const action of perm.actions) {
        const slug = `${perm.resource}-${action}`;
        const name = `${perm.resource.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} ${actionNames[action]}`;

        await queryRunner.query(
          `
          INSERT INTO permissions ("menuManagerId", name, slug, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (slug) DO UPDATE SET
            "menuManagerId" = EXCLUDED."menuManagerId",
            name = EXCLUDED.name,
            description = EXCLUDED.description
        `,
          [menuId, name, slug, `${actionNames[action]} ${perm.resource}`]
        );
      }
    }

    // Assign all permissions to Super Admin role (role_id = 1)
    const allPermissions = await queryRunner.query(`SELECT id FROM permissions`);

    for (const permission of allPermissions) {
      // Check if already exists
      const exists = await queryRunner.query(
        `SELECT 1 FROM permission_role WHERE permission_id = $1 AND role_id = $2`,
        [permission.id, '1']
      );
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO permission_role (permission_id, role_id) VALUES ($1, $2)`,
          [permission.id, '1']
        );
      }
    }

    // Assign all menus to Super Admin role
    const allMenus = await queryRunner.query(`SELECT id FROM menu_managers WHERE type = 'module'`);

    for (const menu of allMenus) {
      // Check if already exists
      const exists = await queryRunner.query(
        `SELECT 1 FROM menu_manager_role WHERE menu_manager_id = $1 AND role_id = $2`,
        [menu.id, '1']
      );
      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO menu_manager_role (menu_manager_id, role_id) VALUES ($1, $2)`,
          [menu.id, '1']
        );
      }
    }

    console.log('✅ All menus and permissions seeded successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded permissions (except the original ones)
    const slugsToRemove = [
      'chat-index',
      'chat-store',
      'chat-show',
      'chat-update',
      'chat-destroy',
      'phone-number-index',
      'phone-number-store',
      'phone-number-show',
      'phone-number-update',
      'phone-number-destroy',
      'contact-index',
      'contact-store',
      'contact-show',
      'contact-update',
      'contact-destroy',
      'quick-reply-index',
      'quick-reply-store',
      'quick-reply-show',
      'quick-reply-update',
      'quick-reply-destroy',
      'template-index',
      'template-store',
      'template-show',
      'template-update',
      'template-destroy',
      'webhook-index',
      'webhook-store',
      'webhook-show',
      'webhook-update',
      'webhook-destroy',
      'message-queue-index',
      'message-queue-store',
      'message-queue-show',
      'message-queue-update',
      'message-queue-destroy',
    ];

    for (const slug of slugsToRemove) {
      await queryRunner.query(`DELETE FROM permissions WHERE slug = $1`, [slug]);
    }

    // Remove seeded menus
    const menuSlugsToRemove = [
      'chat',
      'whatsapp',
      'phone-number',
      'contact',
      'quick-reply',
      'template',
      'management',
      'webhook',
      'message-queue',
    ];

    for (const slug of menuSlugsToRemove) {
      await queryRunner.query(`DELETE FROM menu_managers WHERE slug = $1`, [slug]);
    }
  }
}
