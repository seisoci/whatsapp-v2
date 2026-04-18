/**
 * Meilisearch Bulk Sync Script
 *
 * Syncs ALL existing contacts and messages from PostgreSQL → Meilisearch.
 * Run once (or anytime you need a full re-index):
 *
 *   bun run meili:sync
 *
 * Strategy:
 *   - Processes in batches of 1 000 rows to avoid memory spikes on large datasets
 *   - Uses raw SQL for maximum throughput (no ORM overhead)
 *   - Idempotent: addDocuments with primaryKey upserts existing docs
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import {
  setupMeilisearchIndexes,
  indexContacts,
  indexMessages,
  type MeiliContact,
  type MeiliMessage,
} from '../services/meilisearch.service';

const BATCH_SIZE = 1_000;

// ───────────────────────────────────────────────────────────
// Contacts sync
// ───────────────────────────────────────────────────────────
async function syncContacts(): Promise<void> {
  console.log('[sync] Starting contacts sync…');

  let offset = 0;
  let totalSynced = 0;

  while (true) {
    const rows: any[] = await AppDataSource.query(
      `SELECT
         id,
         wa_id            AS "waId",
         phone_number     AS "phoneNumber",
         profile_name     AS "profileName",
         business_name    AS "businessName",
         phone_number_id  AS "phoneNumberId",
         is_archived      AS "isArchived",
         unread_count     AS "unreadCount",
         last_message_at  AS "lastMessageAt",
         created_at       AS "createdAt"
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

    totalSynced += rows.length;
    offset += rows.length;
    console.log(`[sync] Contacts: ${totalSynced} indexed…`);

    if (rows.length < BATCH_SIZE) break;
  }

  console.log(`[sync] Contacts done — total: ${totalSynced}`);
}

// ───────────────────────────────────────────────────────────
// Messages sync (only text / caption messages are indexed)
// ───────────────────────────────────────────────────────────
async function syncMessages(): Promise<void> {
  console.log('[sync] Starting messages sync…');

  let offset = 0;
  let totalSynced = 0;

  while (true) {
    // Join with contacts to get denormalized name & phone for display
    const rows: any[] = await AppDataSource.query(
      `SELECT
         m.id,
         m.contact_id        AS "contactId",
         m.phone_number_id   AS "phoneNumberId",
         c.profile_name      AS "contactName",
         c.phone_number      AS "contactPhone",
         m.direction,
         m.message_type      AS "messageType",
         m.text_body         AS "textBody",
         m.media_caption     AS "mediaCaption",
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

    totalSynced += rows.length;
    offset += rows.length;
    console.log(`[sync] Messages: ${totalSynced} indexed…`);

    if (rows.length < BATCH_SIZE) break;
  }

  console.log(`[sync] Messages done — total: ${totalSynced}`);
}

// ───────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('[sync] Connecting to database…');
  await AppDataSource.initialize();

  console.log('[sync] Setting up Meilisearch indexes…');
  await setupMeilisearchIndexes();

  await syncContacts();
  await syncMessages();

  console.log('[sync] All done!');
  await AppDataSource.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('[sync] Fatal error:', err);
  process.exit(1);
});
