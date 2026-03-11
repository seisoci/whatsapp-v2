import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optimise webhook_logs to eliminate WAL-related kernel D-state and index write amplification.
 *
 * Root cause of stuck INSERTs (requiring kill -9):
 *   - webhook_logs has 9 indexes → every INSERT writes 9 B-tree pages to WAL
 *   - Under heavy write load, PostgreSQL workers enter uninterruptible kernel D-state
 *     waiting for disk I/O.  statement_timeout / lock_timeout cannot abort D-state.
 *
 * Fixes applied:
 *   1. DROP 4 low-value indexes (event_type, wamid, wa_id, received_at).
 *      Idempotency dedup now handled by Redis SETNX — the UNIQUE index on idempotency_key
 *      is still needed as a hard safety net, but we convert it to a plain (non-unique)
 *      index since Redis already guarantees uniqueness before INSERT.
 *   2. ALTER TABLE … SET UNLOGGED — removes WAL entirely for this table.
 *      Trade-off: data may be truncated after a PostgreSQL crash (acceptable for logs).
 */
export class OptimizeWebhookLogs1704000000033 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop 4 low-value indexes to reduce write amplification
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_WEBHOOK_LOGS_EVENT_TYPE"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_WEBHOOK_LOGS_WAMID"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_WEBHOOK_LOGS_WA_ID"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_WEBHOOK_LOGS_RECEIVED_AT"`);

    // Drop the UNIQUE index on idempotency_key — Redis gate makes it redundant.
    // Replace with a plain (non-unique) index so queries by idempotency_key still work.
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_WEBHOOK_LOGS_IDEMPOTENCY_KEY"`);
    // Also drop the unique constraint that createTable added (isUnique: true creates both)
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'webhook_logs'::regclass
            AND contype = 'u'
            AND conname ILIKE '%idempotency%'
        ) THEN
          EXECUTE (
            SELECT 'ALTER TABLE webhook_logs DROP CONSTRAINT ' || quote_ident(conname)
            FROM pg_constraint
            WHERE conrelid = 'webhook_logs'::regclass
              AND contype = 'u'
              AND conname ILIKE '%idempotency%'
            LIMIT 1
          );
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_WEBHOOK_LOGS_IDEMPOTENCY_KEY"
        ON webhook_logs (idempotency_key)
    `);

    // Make the table UNLOGGED — eliminates all WAL writes for webhook_logs.
    // PostgreSQL will truncate this table after a crash, which is acceptable for
    // an audit/debug log that is already deduplicated and processed via BullMQ.
    await queryRunner.query(`ALTER TABLE webhook_logs SET UNLOGGED`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE webhook_logs SET LOGGED`);

    // Restore dropped indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_WEBHOOK_LOGS_EVENT_TYPE" ON webhook_logs (event_type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_WEBHOOK_LOGS_WAMID" ON webhook_logs (wamid)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_WEBHOOK_LOGS_WA_ID" ON webhook_logs (wa_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_WEBHOOK_LOGS_RECEIVED_AT" ON webhook_logs (received_at)`);

    // Restore unique constraint on idempotency_key
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_WEBHOOK_LOGS_IDEMPOTENCY_KEY"`);
    await queryRunner.query(`
      ALTER TABLE webhook_logs
        ADD CONSTRAINT "UQ_webhook_logs_idempotency_key" UNIQUE (idempotency_key)
    `);
  }
}
