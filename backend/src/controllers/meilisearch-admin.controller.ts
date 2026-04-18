/**
 * Meilisearch Admin Controller
 * Endpoints for managing Meilisearch indexes from the UI.
 */

import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import {
  meiliClient,
  CONTACTS_INDEX,
  MESSAGES_INDEX,
  getIndexStats,
  getIndexDocuments,
  clearIndex,
  indexContacts,
  indexMessages,
  setupMeilisearchIndexes,
  type MeiliContact,
  type MeiliMessage,
} from '../services/meilisearch.service';

const BATCH_SIZE = 1_000;
const VALID_INDEXES = [CONTACTS_INDEX, MESSAGES_INDEX] as const;

function isValidIndex(name: string): name is typeof VALID_INDEXES[number] {
  return (VALID_INDEXES as readonly string[]).includes(name);
}

// ─── Shared sync helpers (mirrors meili-sync.ts but callable from HTTP) ─────

async function syncContacts(clearFirst: boolean): Promise<number> {
  if (clearFirst) await clearIndex(CONTACTS_INDEX);

  let offset = 0;
  let total = 0;

  while (true) {
    const rows: any[] = await AppDataSource.query(
      `SELECT
         id, wa_id AS "waId", phone_number AS "phoneNumber",
         profile_name AS "profileName", business_name AS "businessName",
         phone_number_id AS "phoneNumberId", is_archived AS "isArchived",
         unread_count AS "unreadCount", last_message_at AS "lastMessageAt",
         created_at AS "createdAt"
       FROM contacts
       ORDER BY created_at ASC
       LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset],
    );

    if (rows.length === 0) break;

    const docs: MeiliContact[] = rows.map((r) => ({
      id: r.id,
      waId: r.waId,
      phoneNumber: r.phoneNumber,
      profileName: r.profileName,
      businessName: r.businessName,
      phoneNumberId: r.phoneNumberId,
      isArchived: r.isArchived,
      unreadCount: Number(r.unreadCount) || 0,
      lastMessageAt: r.lastMessageAt ? new Date(r.lastMessageAt).getTime() : null,
      createdAt: new Date(r.createdAt).getTime(),
    }));

    await indexContacts(docs);
    total += rows.length;
    offset += rows.length;
    if (rows.length < BATCH_SIZE) break;
  }

  return total;
}

async function syncMessages(clearFirst: boolean): Promise<number> {
  if (clearFirst) await clearIndex(MESSAGES_INDEX);

  let offset = 0;
  let total = 0;

  while (true) {
    const rows: any[] = await AppDataSource.query(
      `SELECT
         m.id, m.contact_id AS "contactId", m.phone_number_id AS "phoneNumberId",
         c.profile_name AS "contactName", c.phone_number AS "contactPhone",
         m.direction, m.message_type AS "messageType",
         m.text_body AS "textBody", m.media_caption AS "mediaCaption",
         m.timestamp
       FROM messages m
       JOIN contacts c ON c.id = m.contact_id
       WHERE m.message_type = 'text'
         AND m.text_body IS NOT NULL
         AND m.text_body <> ''
       ORDER BY m.timestamp ASC
       LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset],
    );

    if (rows.length === 0) break;

    const docs: MeiliMessage[] = rows.map((r) => ({
      id: r.id,
      contactId: r.contactId,
      phoneNumberId: r.phoneNumberId,
      contactName: r.contactName,
      contactPhone: r.contactPhone,
      direction: r.direction,
      messageType: r.messageType,
      textBody: r.textBody,
      mediaCaption: r.mediaCaption,
      timestamp: new Date(r.timestamp).getTime(),
    }));

    await indexMessages(docs);
    total += rows.length;
    offset += rows.length;
    if (rows.length < BATCH_SIZE) break;
  }

  return total;
}

// ─── Controller ──────────────────────────────────────────────────────────────

export class MeilisearchAdminController {
  static permissions = {
    getStats: 'meilisearch-index',
    getDocuments: 'meilisearch-index',
    clearIndex: 'meilisearch-destroy',
    resyncForceIndex: 'meilisearch-store',
    resyncContinueIndex: 'meilisearch-store',
    resyncForceAll: 'meilisearch-store',
    resyncContinueAll: 'meilisearch-store',
  };

  /**
   * GET /api/v1/meilisearch/stats
   * Returns document count + isIndexing for each index.
   */
  static async getStats(c: Context) {
    try {
      const stats = await getIndexStats();
      return c.json({ success: true, data: stats });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * GET /api/v1/meilisearch/indexes/:index/documents?offset=0&limit=20
   * Browse documents in a specific index.
   */
  static async getDocuments(c: Context) {
    try {
      const index = c.req.param('index');
      if (!isValidIndex(index)) {
        return c.json({ success: false, message: 'Invalid index name' }, 400);
      }

      const offset = parseInt(c.req.query('offset') || '0');
      const limit = parseInt(c.req.query('limit') || '20');

      const result = await getIndexDocuments(index, offset, limit);
      return c.json({ success: true, data: result });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * DELETE /api/v1/meilisearch/indexes/:index/documents
   * Delete ALL documents in a specific index (keeps index + settings).
   */
  static async clearIndexDocuments(c: Context) {
    try {
      const index = c.req.param('index');
      if (!isValidIndex(index)) {
        return c.json({ success: false, message: 'Invalid index name' }, 400);
      }

      await clearIndex(index);
      return c.json({ success: true, message: `All documents in "${index}" deleted` });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * POST /api/v1/meilisearch/indexes/:index/resync-force
   * Clear then full re-index a specific index.
   */
  static async resyncForceIndex(c: Context) {
    try {
      const index = c.req.param('index');
      if (!isValidIndex(index)) {
        return c.json({ success: false, message: 'Invalid index name' }, 400);
      }

      await setupMeilisearchIndexes();
      let synced = 0;

      if (index === CONTACTS_INDEX) synced = await syncContacts(true);
      else synced = await syncMessages(true);

      return c.json({ success: true, message: `Force resynced "${index}"`, synced });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * POST /api/v1/meilisearch/indexes/:index/resync-continue
   * Upsert-only re-index (keeps existing docs) for a specific index.
   */
  static async resyncContinueIndex(c: Context) {
    try {
      const index = c.req.param('index');
      if (!isValidIndex(index)) {
        return c.json({ success: false, message: 'Invalid index name' }, 400);
      }

      await setupMeilisearchIndexes();
      let synced = 0;

      if (index === CONTACTS_INDEX) synced = await syncContacts(false);
      else synced = await syncMessages(false);

      return c.json({ success: true, message: `Continue resynced "${index}"`, synced });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * POST /api/v1/meilisearch/resync-force
   * Clear ALL indexes then full re-index everything.
   */
  static async resyncForceAll(c: Context) {
    try {
      await setupMeilisearchIndexes();
      const [contactsSynced, messagesSynced] = await Promise.all([
        syncContacts(true),
        syncMessages(true),
      ]);

      return c.json({
        success: true,
        message: 'Force resynced all indexes',
        data: { contacts: contactsSynced, messages: messagesSynced },
      });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  /**
   * POST /api/v1/meilisearch/resync-continue
   * Upsert-only re-index all indexes (no deletions).
   */
  static async resyncContinueAll(c: Context) {
    try {
      await setupMeilisearchIndexes();
      const [contactsSynced, messagesSynced] = await Promise.all([
        syncContacts(false),
        syncMessages(false),
      ]);

      return c.json({
        success: true,
        message: 'Continue resynced all indexes',
        data: { contacts: contactsSynced, messages: messagesSynced },
      });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }
}
