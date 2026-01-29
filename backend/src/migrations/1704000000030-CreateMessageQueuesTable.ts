import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create message_queues table for tracking public API message requests
 * with request metadata (IP, headers, device), queue status, and billing info
 */
export class CreateMessageQueuesTable1704000000030 implements MigrationInterface {
  name = 'CreateMessageQueuesTable1704000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "message_queues" (
        "id"                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,

        -- Referensi
        "message_id"            UUID,
        "api_endpoint_id"       UUID,
        "phone_number_id"       UUID NOT NULL,
        "contact_id"            UUID,
        "user_id"               UUID,

        -- Payload
        "recipient_phone"       VARCHAR(20) NOT NULL,
        "template_name"         VARCHAR(255) NOT NULL,
        "template_language"     VARCHAR(10) DEFAULT 'id',
        "template_components"   JSONB,

        -- Request Metadata
        "ip_address"            INET,
        "api_key_masked"        VARCHAR(50),
        "user_agent"            TEXT,
        "device_info"           VARCHAR(255),
        "request_headers"       JSONB,

        -- Status
        "queue_status"          VARCHAR(20) NOT NULL DEFAULT 'pending',
        "message_status"        VARCHAR(20),
        "wamid"                 VARCHAR(255),

        -- Template Category (Meta: MARKETING | UTILITY | AUTHENTICATION)
        "template_category"     VARCHAR(50),

        -- Billing
        "is_billable"           BOOLEAN NOT NULL DEFAULT true,
        "billable_category"     VARCHAR(50),

        -- Error
        "error_message"         TEXT,
        "error_code"            VARCHAR(50),

        -- Retry
        "attempts"              INT NOT NULL DEFAULT 0,
        "max_attempts"          INT NOT NULL DEFAULT 3,
        "next_retry_at"         TIMESTAMP WITH TIME ZONE,

        -- Timestamps
        "scheduled_at"          TIMESTAMP WITH TIME ZONE,
        "processed_at"          TIMESTAMP WITH TIME ZONE,
        "completed_at"          TIMESTAMP WITH TIME ZONE,
        "created_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Foreign Keys
        CONSTRAINT "fk_mq_message"       FOREIGN KEY ("message_id")       REFERENCES "messages"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_mq_api_endpoint"  FOREIGN KEY ("api_endpoint_id")  REFERENCES "api_endpoints"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_mq_phone_number"  FOREIGN KEY ("phone_number_id")  REFERENCES "phone_numbers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_mq_contact"       FOREIGN KEY ("contact_id")       REFERENCES "contacts"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_mq_user"          FOREIGN KEY ("user_id")          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_mq_queue_status" ON "message_queues" ("queue_status")`);
    await queryRunner.query(`CREATE INDEX "IDX_mq_api_endpoint_id" ON "message_queues" ("api_endpoint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_mq_created_at" ON "message_queues" ("created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_mq_is_billable" ON "message_queues" ("is_billable")`);
    await queryRunner.query(`CREATE INDEX "IDX_mq_template_name" ON "message_queues" ("template_name")`);
    await queryRunner.query(`CREATE INDEX "IDX_mq_template_category" ON "message_queues" ("template_category")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_template_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_template_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_is_billable"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_api_endpoint_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mq_queue_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "message_queues"`);
  }
}
