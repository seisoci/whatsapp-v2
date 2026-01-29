import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add redis_job_id and last_dispatched_at columns to message_queues
 * for BullMQ dispatcher tracking and duplicate prevention.
 */
export class AddQueueDispatchColumns1704000000031 implements MigrationInterface {
  name = 'AddQueueDispatchColumns1704000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns
    await queryRunner.query(`
      ALTER TABLE "message_queues"
        ADD COLUMN "redis_job_id" VARCHAR(255),
        ADD COLUMN "last_dispatched_at" TIMESTAMP WITH TIME ZONE
    `);

    // Composite index for cron dispatcher scan
    await queryRunner.query(`
      CREATE INDEX "IDX_mq_dispatch_scan"
      ON "message_queues" ("queue_status", "attempts", "scheduled_at")
    `);

    // Index on redis_job_id for lookup
    await queryRunner.query(`
      CREATE INDEX "IDX_mq_redis_job_id"
      ON "message_queues" ("redis_job_id")
      WHERE "redis_job_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_redis_job_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_dispatch_scan"`);
    await queryRunner.query(`
      ALTER TABLE "message_queues"
        DROP COLUMN IF EXISTS "last_dispatched_at",
        DROP COLUMN IF EXISTS "redis_job_id"
    `);
  }
}
