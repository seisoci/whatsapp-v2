import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix menu_managers structure:
 * - Set correct parentId for child menus (WhatsApp children & Management children)
 * - Fix sort order to match hydrogen menu layout:
 *   1. Dashboard
 *   2. Chat
 *   3. WhatsApp → Phone Numbers, Contacts, Quick Replies, Templates
 *   4. Analytics
 *   5. Management → Users, Roles, Permissions, Template Roles, Webhook, Message Queue
 */
export class FixMenuStructure1704000000038 implements MigrationInterface {
  name = 'FixMenuStructure1704000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get parent IDs
    const [whatsapp] = await queryRunner.query(`SELECT id FROM menu_managers WHERE slug = 'whatsapp'`);
    const [management] = await queryRunner.query(`SELECT id FROM menu_managers WHERE slug = 'management'`);

    const whatsappId = whatsapp?.id;
    const managementId = management?.id;

    if (!whatsappId || !managementId) {
      console.error('WhatsApp or Management menu not found');
      return;
    }

    // ── Fix top-level sort orders ──
    await queryRunner.query(`UPDATE menu_managers SET sort = 1 WHERE slug = 'dashboard'`);
    await queryRunner.query(`UPDATE menu_managers SET sort = 2 WHERE slug = 'chat'`);
    await queryRunner.query(`UPDATE menu_managers SET sort = 3 WHERE slug = 'whatsapp'`);
    await queryRunner.query(`UPDATE menu_managers SET sort = 4 WHERE slug = 'analytics'`);
    await queryRunner.query(`UPDATE menu_managers SET sort = 5 WHERE slug = 'management'`);

    // ── WhatsApp children: set parentId and sort ──
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 1 WHERE slug = 'phone-number'`,
      [whatsappId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 2 WHERE slug = 'contact'`,
      [whatsappId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 3 WHERE slug = 'quick-reply'`,
      [whatsappId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 4 WHERE slug = 'template'`,
      [whatsappId]
    );

    // ── Management children: set parentId and sort ──
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 1 WHERE slug = 'user'`,
      [managementId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 2 WHERE slug = 'role'`,
      [managementId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 3 WHERE slug = 'permission'`,
      [managementId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 4 WHERE slug = 'template-role'`,
      [managementId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 5 WHERE slug = 'webhook'`,
      [managementId]
    );
    await queryRunner.query(
      `UPDATE menu_managers SET "parentId" = $1, sort = 6 WHERE slug = 'message-queue'`,
      [managementId]
    );

    console.log('✅ Menu structure fixed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert all parentId back to 0
    const slugs = ['phone-number', 'contact', 'quick-reply', 'template', 'user', 'role', 'permission', 'template-role', 'webhook', 'message-queue'];
    for (const slug of slugs) {
      await queryRunner.query(`UPDATE menu_managers SET "parentId" = 0 WHERE slug = $1`, [slug]);
    }
  }
}
